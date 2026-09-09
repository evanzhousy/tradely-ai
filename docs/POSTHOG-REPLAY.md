# Heatmaps and session replay

Enabled for Tradely PostHog project `582920` on 2026-09-09 at the user's request.

- [Session replay](https://us.posthog.com/project/582920/replay/home)
- [Heatmap settings](https://us.posthog.com/project/582920/settings/project-heatmaps)

## Configuration

The project enables session recording and heatmaps with 100% sampling of eligible
consented sessions and the existing 30-day recording retention. Console capture,
network capture, request/response headers/bodies, and canvas recording stay off.
The browser initializes visual capture disabled, then enables it after version-2
analytics consent. The banner, privacy policy, and cookie policy explain the
expanded scope in English and Chinese. Previous consent is not automatically
upgraded: local storage uses `tradely.analytics-consent.v2` and the server requires
`tradely_analytics_consent_v2`.

`client.ts` bundles `posthog-recorder` with the existing deferred SDK extensions.
External script loading remains disabled. JSON project configuration is allowed
after consent because replay needs the server's enablement/sampling settings;
feature-flag evaluation, surveys, and other optional widgets stay disabled.

## Privacy and lifecycle

`replay-privacy.ts` owns the replay/heatmap payload boundary:

- Mask all text and input values. Preserve only layout/state DOM attributes;
  mask links, media sources, titles, accessible labels, and application data.
- Block images, video/audio, canvases, iframes/embeds, scripts, lesson prose,
  `#interactive-practice`, and `[data-analytics-private]` subtrees.
- Strip query strings/fragments from replay navigation metadata and merge
  heatmap URL buckets by sanitized URL. Do not retain network request details.
- Keep recorder compression enabled in normal application use.

`browser-consent.ts` synchronizes event and visual capture. Withdrawal disables
heatmap listeners and clears their pending buffer as well as stopping recording.
Simply opting out of SDK event delivery is insufficient: this SDK can otherwise
buffer clicks while opted out and emit them after re-granting consent.

The coordinate heatmap (`$$heatmap`) works with generic DOM autocapture disabled.
`$pageleave` supplies scroll measurements on unload and before SPA page views.
The older element-based clickmap is not enabled; it requires generic autocapture.

## Verification and release

Tests cover real rrweb snapshots and mutations, input/text/attribute masking,
blocked lesson/media contents, nested heatmap URL sanitization, withdrawal buffer
clearing, fresh consent, and SPA page-leave ordering. Browser verification must
also confirm `sessionRecordingStarted()`, actual snapshot and heatmap capture,
and zero new visual events after withdrawal.

Project settings are live. Application collection requires deployment of this
commit; project toggles cannot override an older application's explicit disabled
settings. Keep local probes separate from production traffic. Never expose or
commit source-map credentials, project tokens, or protected media URLs.

The 2026-09-09 checks passed 382 tests, type checking, the local Vite build, scoped
Biome checks, and the credential scan. The browser reported recording `active`,
emitted `$snapshot` and `$$heatmap`, and showed the uploaded
[local verification recording](https://us.posthog.com/project/582920/replay/01a085d9-426f-703b-800f-01e3d362f663)
in PostHog with masked text and inputs. A probe placed in text, input values,
attributes, protected content, and a URL query was absent from the uncompressed
snapshot/heatmap payload. Withdrawal stopped recording and heatmaps and produced
zero new events during subsequent interaction. Compression was disabled only in
that local browser to inspect the captured payload; application defaults retain it.

References: [Replay privacy](https://posthog.com/docs/session-replay/privacy),
[heatmaps](https://posthog.com/docs/toolbar/heatmaps).
