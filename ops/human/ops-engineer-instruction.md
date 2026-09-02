# Tradely media ownership and release practice

This document is the operating contract for course and concept media in the
`tradely` repository. It keeps the source tree reviewable, keeps paid media
private, and makes every release recoverable without committing large media
blobs.

## Objective

Tradely is the paid learning hub. Git should describe the curriculum and the
media contract; Cloudflare R2 should deliver the final media.

- Git stores lesson source, scripts, manifests, captions/source metadata,
  storyboards, and small operational documentation.
- The private `tradely-media` R2 bucket stores paid-course and concept video
  binaries and their private caption tracks.
- ChatCut/HyperFrames remains an editable production source, not a runtime
  dependency or a Git binary archive.
- TradingFlow is a linked practice product. Do not copy its Landing media or
  credentials into Tradely.

## Ownership and visibility

### Tradely-owned media

- Paid Academy lessons use the `tradingflow-foundations/` R2 prefix.
- Concept cards and paid case-study media use the `tradingflow-concepts/`
  prefix.
- Every uploaded object is private and is served only through the server's
  short-lived, user-bound presigned URL after the Clerk/Stripe access decision.

### Public preview exception

The first three preview lessons may be copied to
`apps/web/public/media/tradingflow/` for local development and public preview
behavior. Their final video binaries are still delivery media and must not be
committed; the existing small poster/caption files are intentionally tracked
because the current web runtime serves them directly. If those files move to
R2, add them to the manifest, verify the remote path, then remove them from the
index in a separate cleanup commit.

### Never cross the boundary

- Do not reference `tradingflow-web-landingpage` in Tradely source or scripts.
- Do not make `tradely-media` public to simplify a player.
- Do not put private paid videos under `apps/web/public/`.
- Do not place Landing's free tutorial videos or public R2 keys in this repo.

## What belongs in Git

Track:

- `apps/web/src/content/course.ts` and lesson copy.
- `scripts/media-manifest.json` and the media import/assert/upload scripts.
- `meta.json`, `hyperframes.json`, `package.json`, `SCRIPT.md`,
  `STORYBOARD.md`, `BRIEF.md`, and `PRODUCTION-STATUS.md` when they document
  an editable lesson or its provenance.
- Lightweight `.media/manifest.jsonl`, capture manifests, checksums, and
  release notes.
- Public preview posters/captions that the current app intentionally serves.

Do not track:

- `.mp4`, `.webm`, `.mov`, `.wav`, `.aiff`, `.mp3`, `.aac`, font binaries,
  generated screenshots, extracted frame images, GIF/contact sheets, or
  waveform/thumbnails.
- HyperFrames/ChatCut `index.html` compositions, generated `renders/`,
  `.hyperframes/` caches, `.media/images/`, or editor preference files.
- `apps/web/private-media/` and private R2 downloads.
- Credentials, `.env` files, presigned URLs, or user-specific progress data.

The repository `.gitignore` is the enforcement layer. Check representative
paths before every media commit:

```bash
git status --short --untracked-files=all
git diff --cached --name-only
git check-ignore -v \
  videos/tradingflow-academy/season-4/s4e04-open-a-symbol-drawer-with-freshness-checks/renders/s4e04-video.mp4 \
  videos/tradingflow-academy/season-4/s4e04-open-a-symbol-drawer-with-freshness-checks/index.html \
  apps/web/private-media/tradingflow/03-symbol-drawer.mp4
```

If an artifact is already tracked, remove it with `git rm --cached` so the
working copy remains available to the editor. Do not use a destructive delete
just to reduce Git size.

## Source-of-truth map

| Concern | Source of truth |
| --- | --- |
| Curriculum and lesson access | `apps/web/src/content/course.ts` |
| Owned R2 keys and visibility | `scripts/media-manifest.json` |
| Import from local Academy tree | `scripts/import-course-media.mjs` |
| R2 upload/checksum verification | `apps/web/scripts/upload-course-media.mjs` |
| Boundary assertion | `scripts/assert-media-boundary.mjs` |
| Editable video production | ChatCut project / HyperFrames source on disk |
| Paid final binaries | private `tradely-media` R2 objects |
| Public preview delivery | `apps/web/public/media/tradingflow/` plus configured public base |

The manifest is the only place to add a new owned R2 key. Each asset must have
an owner, visibility, content type, cache policy, source/provenance, and a
`requiredBy` lesson or archive reference. Never hard-code an object URL in a
lesson component.

## Media workflow

1. Decide ownership before production. App-use onboarding belongs to Landing;
   option education, Academy, and paid case studies belong here.
2. Keep the editable ChatCut/HyperFrames project locally. Store its timeline,
   source, and editorial facts in metadata, not in a committed render.
3. Produce the final video and caption track. Keep local binaries in the
   ignored `videos/` or `apps/web/private-media/` paths.
4. Add or update the asset rows in `scripts/media-manifest.json`. Use only
   `tradingflow-foundations/` or `tradingflow-concepts/` keys for private media.
5. Run the safe checks before any upload:

   ```bash
   pnpm media:assert
   pnpm media:assert:local
   pnpm check-types
   ```

   `media:assert` checks ownership and metadata without requiring local
   binaries. `media:assert:local` is the stricter gate when a re-import or
   upload is actually about to run.
6. Upload and verify through the allowlisted manifest command:

   ```bash
   pnpm media:upload
   # or read-only verification after an existing upload
   pnpm media:verify
   ```

   The uploader must use the configured S3-compatible endpoint, `private,
   no-store` cache policy, `owner=tradely`, `visibility=private`, and checksum
   comparison. It must never upload a wildcard directory.
7. Verify the app route with a signed-in user and confirm that a locked lesson
   cannot obtain a media URL. Confirm an entitled lesson receives a short-lived
   URL and that the browser can seek/stream it without exposing the bucket.
8. Run the production-quality gates:

   ```bash
   pnpm check-types
   pnpm --filter web test
   pnpm exec biome check .
   pnpm build
   ```

9. Deploy only through an explicitly authorized production workflow. A local
   build or a successful R2 upload is not deployment proof.
10. Record the release date, manifest version, object count/checksums, and any
    deploy identifier in a lightweight release note. Keep the previous object
    set available until the new access path is verified.

## Private-media verification

For every private asset, require all of the following:

- the manifest row is `visibility: "private"`;
- the key belongs to the correct owned prefix;
- the object is not present under `apps/web/public/`;
- remote size and checksum match the local release source;
- `Cache-Control` is `private, no-store`;
- remote metadata includes `owner=tradely` and `visibility=private`;
- unauthenticated/public object access does not return the media;
- an entitled authenticated browser receives only a time-limited presigned URL.

Do not treat a 200 response from a local dev path as proof of private R2
delivery. Prove the access decision, URL issuance, and remote object path as
separate facts.

## Versioning and rollback

- Use a new manifest/object key when content changes materially; do not mutate
  an immutable production object in place and rely on CDN invalidation.
- Preserve the prior manifest rows and R2 objects until the replacement has
  passed access, checksum, and browser verification.
- Rollback means restoring the prior manifest/content version and redeploying;
  it does not mean deleting local source or making the bucket public.
- Keep source provenance and checksums in metadata so an ignored binary can be
  restored from ChatCut, the release archive, or R2 without guessing.

## Git integration practice

Use a focused `codex/...` branch and Conventional Commits. Before committing:

```bash
git status --short
git diff --cached --check
git diff --cached --stat
```

Stage source/metadata intentionally. If a change includes a generated
composition or media file, stop and classify it first; add a manifest row or
README instead of the binary. Re-fetch before merging and preserve unrelated
commits already on `main`:

```bash
git fetch origin main
git log --oneline --decorate -5 origin/main main
```

Pushing `main` is a separate operator-authorized action from a local merge.

## Failure handling

- **Manifest source missing:** use `pnpm media:assert` to inspect metadata; use
  `pnpm media:assert:local` only when the local source is required for an
  upload. Do not weaken private visibility to bypass the error.
- **R2 checksum/metadata mismatch:** stop release, keep the previous object
  set active, and rerun read-only verification after correcting the upload.
- **Private video appears in public HTML:** remove the public staging copy,
  verify the server route, and confirm the browser only sees a presigned URL
  after entitlement.
- **Cross-repository reference:** remove the reference and identify the proper
  Landing/Tradely owner; never copy the other project's media as a shortcut.
- **HyperFrames render failure:** retain the editable source and error metadata;
  do not replace it with an unreviewed flattened export.
- **Build/check failure in generated files:** isolate the generated path and
  report it; do not delete source or media to make checks pass.

## Agent Handoff

This file is a durable practice guide. Current media rows, checksums, and
release-specific IDs belong in `scripts/media-manifest.json` or a versioned
release note. No production operation is performed by reading this document.

## Runbook Self-Maintenance

At the end of each media release:

1. Promote durable lessons about ownership, storage, access, caching, or
   verification into this guide.
2. Keep transient render IDs, object counts, and blockers in release metadata,
   not in this durable procedure.
3. Prune completed handoff items and leave only unresolved next actions.
4. Re-check that `.gitignore`, the manifest, importer, uploader, app media
   route, and tests describe the same visibility boundary.
5. If no durable rule changed, report `Runbook maintenance: no change`.

Update this guide when a storage owner, R2 prefix, artifact location, access
contract, command, or verification gate changes. Do not update it for one-off
signed URLs, raw logs, or completed release checklist items.
