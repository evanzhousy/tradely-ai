ALTER TABLE "lesson_attempt" ADD COLUMN "guest_import_id" text;--> statement-breakpoint
ALTER TABLE "lesson_attempt" ADD COLUMN "guest_import_hash" text;--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_attempt_guest_import" ON "lesson_attempt" USING btree ("guest_import_id");--> statement-breakpoint
ALTER TABLE "lesson_attempt" ADD CONSTRAINT "lesson_attempt_guest_import_pair" CHECK (("lesson_attempt"."guest_import_id" is null and "lesson_attempt"."guest_import_hash" is null) or ("lesson_attempt"."guest_import_id" is not null and "lesson_attempt"."guest_import_hash" ~ '^[0-9a-f]{64}$'));
--> statement-breakpoint
-- The application validates/replays actions before this command. This transaction
-- owns repeat-safe claiming, conflict handling and attempt/progress persistence.
CREATE FUNCTION tradely_import_guest_attempt(p_user text, p jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  prior lesson_attempt%ROWTYPE;
  active lesson_attempt%ROWTYPE;
  inserted lesson_attempt%ROWTYPE;
  finished boolean := p->'state'->>'phase' = 'complete';
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('guest-import:' || p_user || ':' || (p->>'lessonId'), 0));
  SELECT * INTO prior FROM lesson_attempt WHERE guest_import_id = p->>'transferId';
  IF FOUND THEN
    IF prior.user_id <> p_user OR prior.guest_import_hash <> p->>'payloadHash' THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'transfer_conflict');
    END IF;
    RETURN jsonb_build_object('ok', true, 'attemptId', prior.id, 'replayed', true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM app_user WHERE user_id = p_user) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'signed_out');
  END IF;
  SELECT * INTO active FROM lesson_attempt
    WHERE user_id = p_user AND lesson_id = p->>'lessonId' AND status = 'in_progress'
    LIMIT 1 FOR UPDATE;
  IF FOUND AND NOT (finished AND coalesce((p->>'saveSeparately')::boolean, false)) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'existing_work', 'existingAttemptId', active.id);
  END IF;
  INSERT INTO lesson_attempt (id, user_id, lesson_id, scenario_id, scenario_version, status,
    revision, state, assessment, submitted_at, guest_import_id, guest_import_hash)
  VALUES (p->>'attemptId', p_user, p->>'lessonId', p->>'scenarioId', (p->>'scenarioVersion')::integer,
    CASE WHEN finished THEN 'submitted' ELSE 'in_progress' END,
    (p->>'revision')::integer, p->'state', nullif(p->'assessment', 'null'),
    CASE WHEN finished THEN now() ELSE NULL END, p->>'transferId', p->>'payloadHash')
  ON CONFLICT DO NOTHING RETURNING * INTO inserted;
  IF inserted.id IS NULL THEN
    SELECT * INTO prior FROM lesson_attempt WHERE guest_import_id = p->>'transferId';
    IF FOUND THEN
      IF prior.user_id = p_user AND prior.guest_import_hash = p->>'payloadHash' THEN
        RETURN jsonb_build_object('ok', true, 'attemptId', prior.id, 'replayed', true);
      END IF;
      RETURN jsonb_build_object('ok', false, 'reason', 'transfer_conflict');
    END IF;
    SELECT * INTO active FROM lesson_attempt
      WHERE user_id = p_user AND lesson_id = p->>'lessonId' AND status = 'in_progress' LIMIT 1;
    RETURN jsonb_build_object('ok', false, 'reason', 'existing_work', 'existingAttemptId', active.id);
  END IF;
  IF finished THEN
    INSERT INTO lesson_progress (user_id, lesson_id, content_version, completed_at)
    VALUES (p_user, p->>'lessonId', (p->>'contentVersion')::integer, now())
    ON CONFLICT (user_id, lesson_id) DO UPDATE SET
      content_version = EXCLUDED.content_version,
      completed_at = CASE WHEN lesson_progress.content_version = EXCLUDED.content_version
        THEN coalesce(lesson_progress.completed_at, EXCLUDED.completed_at) ELSE EXCLUDED.completed_at END,
      last_position_seconds = CASE WHEN lesson_progress.content_version = EXCLUDED.content_version
        THEN lesson_progress.last_position_seconds ELSE NULL END,
      updated_at = now()
    WHERE lesson_progress.content_version <= EXCLUDED.content_version;
  END IF;
  RETURN jsonb_build_object('ok', true, 'attemptId', inserted.id, 'replayed', false);
END;
$$;
