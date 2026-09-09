CREATE TABLE "coaching_generation" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"round" text NOT NULL,
	"command_id" text NOT NULL,
	"input_hash" text NOT NULL,
	"status" text NOT NULL,
	"model" text NOT NULL,
	"prompt_version" integer NOT NULL,
	"feedback" jsonb,
	"error_code" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"cost_micros" integer,
	"elapsed_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lease_expires_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "coaching_generation_valid" CHECK ("coaching_generation"."round" in ('initial', 'revision') and "coaching_generation"."status" in ('running', 'succeeded', 'failed', 'indeterminate'))
);
--> statement-breakpoint
CREATE TABLE "coaching_session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"attempt_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"scenario_id" text NOT NULL,
	"scenario_version" integer NOT NULL,
	"rubric_version" integer NOT NULL,
	"step_id" text NOT NULL,
	"locale" text NOT NULL,
	"draft_reason" text DEFAULT '' NOT NULL,
	"initial_snapshot" jsonb,
	"revised_snapshot" jsonb,
	"revision" integer DEFAULT 0 NOT NULL,
	"last_command_id" text,
	"quota_day" text,
	"reserved_micros" integer DEFAULT 0 NOT NULL,
	"model" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "coaching_session_valid" CHECK ("coaching_session"."revision" >= 0 and "coaching_session"."reserved_micros" >= 0 and length("coaching_session"."draft_reason") <= 1800 and "coaching_session"."locale" in ('en', 'zh'))
);
--> statement-breakpoint
ALTER TABLE "coaching_generation" ADD CONSTRAINT "coaching_generation_session_id_coaching_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."coaching_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coaching_session" ADD CONSTRAINT "coaching_session_user_id_app_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coaching_session" ADD CONSTRAINT "coaching_session_attempt_id_lesson_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."lesson_attempt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "coaching_generation_session_round" ON "coaching_generation" USING btree ("session_id","round");--> statement-breakpoint
CREATE UNIQUE INDEX "coaching_generation_command" ON "coaching_generation" USING btree ("command_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coaching_session_attempt_step" ON "coaching_session" USING btree ("attempt_id","step_id");--> statement-breakpoint
CREATE INDEX "coaching_session_user_day" ON "coaching_session" USING btree ("user_id","quota_day");--> statement-breakpoint
CREATE INDEX "coaching_session_day" ON "coaching_session" USING btree ("quota_day");--> statement-breakpoint
-- Short, database-atomic commands work with neon-http without interactive transactions.
-- The advisory lock serializes quota admission and session writes across instances.
CREATE FUNCTION tradely_coaching_command(p_user text, p_attempt text, p_kind text, p jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  a lesson_attempt%ROWTYPE;
  s coaching_session%ROWTYPE;
  g coaching_generation%ROWTYPE;
  day_key text := (now() AT TIME ZONE 'UTC')::date::text;
  total_cost bigint;
  used_count integer;
BEGIN
  PERFORM pg_advisory_xact_lock(719901);
  SELECT * INTO a FROM lesson_attempt WHERE id = p_attempt AND user_id = p_user FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
  SELECT * INTO s FROM coaching_session WHERE attempt_id = a.id AND step_id = 'guided' FOR UPDATE;

  IF p_kind = 'delete' THEN
    IF s.id IS NULL THEN RETURN jsonb_build_object('ok', true, 'execute', false); END IF;
    UPDATE coaching_generation SET feedback = NULL, input_hash = '',
      status = CASE WHEN status = 'running' THEN 'indeterminate' ELSE status END,
      error_code = 'deleted' WHERE session_id = s.id;
    UPDATE coaching_session SET draft_reason = '', initial_snapshot = NULL, revised_snapshot = NULL,
      deleted_at = now(), updated_at = now(), revision = revision + 1 WHERE id = s.id;
    RETURN jsonb_build_object('ok', true, 'execute', false);
  END IF;
  IF s.deleted_at IS NOT NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'deleted'); END IF;

  IF p_kind = 'finish' THEN
    SELECT * INTO g FROM coaching_generation WHERE id = p->>'generationId' AND session_id = s.id FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
    IF g.status NOT IN ('running', 'indeterminate') THEN RETURN jsonb_build_object('ok', true, 'execute', false); END IF;
    IF p->>'status' NOT IN ('succeeded', 'failed', 'indeterminate') THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid_action'); END IF;
    UPDATE coaching_generation SET status = p->>'status', feedback = nullif(p->'feedback', 'null'),
      error_code = p->>'error', input_tokens = (p->>'inputTokens')::integer,
      output_tokens = (p->>'outputTokens')::integer, cost_micros = (p->>'costMicros')::integer,
      elapsed_ms = (p->>'elapsedMs')::integer, completed_at = now() WHERE id = g.id;
    UPDATE coaching_session SET revision = revision + 1, updated_at = now(),
      completed_at = CASE WHEN g.round = 'revision' AND p->>'status' = 'succeeded' THEN now() ELSE completed_at END WHERE id = s.id;
    RETURN jsonb_build_object('ok', true, 'execute', false);
  END IF;

  IF p_kind NOT IN ('save', 'review') THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid_action'); END IF;
  IF s.id IS NOT NULL AND s.last_command_id = p->>'commandId' THEN RETURN jsonb_build_object('ok', true, 'execute', false); END IF;
  IF p_kind = 'review' THEN
    SELECT * INTO g FROM coaching_generation WHERE command_id = p->>'commandId';
    IF FOUND THEN
      IF g.session_id IS DISTINCT FROM s.id OR g.round <> p->>'round' THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid_action'); END IF;
      RETURN jsonb_build_object('ok', true, 'execute', false);
    END IF;
  END IF;
  IF a.status <> 'in_progress' OR a.state->>'phase' <> 'answer' OR
     (a.state->>'step')::integer <> (p->>'stepIndex')::integer THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_action');
  END IF;
  IF a.revision <> (p->>'attemptRevision')::integer THEN RETURN jsonb_build_object('ok', false, 'reason', 'conflict'); END IF;
  IF a.scenario_id <> p->>'scenarioId' OR a.scenario_version <> (p->>'scenarioVersion')::integer THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'retired');
  END IF;
  IF s.id IS NOT NULL THEN
    IF s.scenario_id <> a.scenario_id OR s.scenario_version <> a.scenario_version OR s.rubric_version <> (p->>'rubricVersion')::integer THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'retired');
    END IF;
    IF s.revision IS DISTINCT FROM (p->>'sessionRevision')::integer THEN RETURN jsonb_build_object('ok', false, 'reason', 'conflict'); END IF;
    IF EXISTS (SELECT 1 FROM coaching_generation WHERE session_id = s.id AND status = 'running') THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'conflict');
    END IF;
  ELSIF p->>'sessionRevision' IS NOT NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'conflict');
  END IF;

  IF p_kind = 'review' THEN
    IF p->>'round' NOT IN ('initial', 'revision') THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid_action'); END IF;
    IF EXISTS (SELECT 1 FROM coaching_generation WHERE session_id = s.id AND round = p->>'round') THEN RETURN jsonb_build_object('ok', true, 'execute', false); END IF;
    IF p->>'round' = 'revision' AND NOT EXISTS (SELECT 1 FROM coaching_generation WHERE session_id = s.id AND round = 'initial' AND status = 'succeeded') THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'invalid_action');
    END IF;
    IF coalesce(s.reserved_micros, 0) = 0 THEN
      IF (p->>'reservationMicros')::integer <= 0 OR (p->>'dailyLimit')::integer NOT BETWEEN 1 AND 3 THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'invalid_action');
      END IF;
      SELECT count(*) INTO used_count FROM coaching_session WHERE user_id = p_user AND quota_day = day_key AND reserved_micros > 0;
      IF used_count >= (p->>'dailyLimit')::integer THEN RETURN jsonb_build_object('ok', false, 'reason', 'quota_exceeded'); END IF;
      SELECT coalesce(sum(reserved_micros), 0) INTO total_cost FROM coaching_session WHERE quota_day = day_key;
      IF total_cost + (p->>'reservationMicros')::integer > (p->>'budgetMicros')::integer THEN RETURN jsonb_build_object('ok', false, 'reason', 'budget_exceeded'); END IF;
    ELSIF s.model <> p->>'model' THEN RETURN jsonb_build_object('ok', false, 'reason', 'retired');
    END IF;
  END IF;

  IF s.id IS NULL THEN
    INSERT INTO coaching_session (id, user_id, attempt_id, lesson_id, scenario_id, scenario_version, rubric_version, step_id, locale)
      VALUES (p->>'sessionId', p_user, a.id, a.lesson_id, a.scenario_id, a.scenario_version, (p->>'rubricVersion')::integer, 'guided', p->>'locale') RETURNING * INTO s;
  END IF;
  IF p_kind = 'save' THEN
    IF EXISTS (SELECT 1 FROM coaching_generation WHERE session_id = s.id AND round = 'revision') THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid_action'); END IF;
    UPDATE coaching_session SET draft_reason = p->>'reason', revision = revision + 1,
      last_command_id = p->>'commandId', updated_at = now() WHERE id = s.id;
    RETURN jsonb_build_object('ok', true, 'execute', false);
  END IF;
  UPDATE coaching_session SET
    initial_snapshot = CASE WHEN p->>'round' = 'initial' THEN p->'snapshot' ELSE initial_snapshot END,
    revised_snapshot = CASE WHEN p->>'round' = 'revision' THEN p->'snapshot' ELSE revised_snapshot END,
    reserved_micros = CASE WHEN reserved_micros = 0 THEN (p->>'reservationMicros')::integer ELSE reserved_micros END,
    quota_day = coalesce(quota_day, day_key), model = p->>'model', revision = revision + 1,
    last_command_id = p->>'commandId', updated_at = now() WHERE id = s.id;
  INSERT INTO coaching_generation (id, session_id, round, command_id, input_hash, status, model, prompt_version, lease_expires_at)
    VALUES (p->>'generationId', s.id, p->>'round', p->>'commandId', p->>'inputHash', 'running', p->>'model', (p->>'promptVersion')::integer, now() + interval '45 seconds');
  RETURN jsonb_build_object('ok', true, 'execute', true, 'generationId', p->>'generationId');
END;
$$;
