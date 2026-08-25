# S1E04 Production Status

Last updated: 2026-07-31

## Current cut

- Runtime: 445 seconds at 30 fps, 1920×1080
- HyperFrames picture draft: `renders/s1e04-picture-draft.mp4`
- Video master with research music bed: `renders/e04-video.mp4`
- HyperFrames validation: full check passed with 0 runtime, layout, motion, or contrast errors
- ChatCut project: `53c7d430-8d39-4ca5-b0fa-a94bc94e389b`
- ChatCut timeline: `a0bf0c3b-2ddd-4b5a-8607-2610985ee713`
- ChatCut picture asset: `db93b466-cc3b-4ae9-8510-80b1b574a34d`
- ChatCut picture item: `571d3e1ca7`

The HyperFrames picture master is paired with the existing low-volume research
music bed in `renders/e04-video.mp4`. A unified English subtitle rail is now
included; its cues are script-derived until the remaining Marcus narration is
assembled.

## HeyGen Marcus voiceover

Voice ID: `0f50a7a5577e4cd583ba738094956899`

Do not regenerate completed segments.

| Segment | Local file | Duration | ChatCut asset | Status |
| --- | --- | ---: | --- | --- |
| 01 | `assets/audio/heygen-marcus/01-the-gap.wav` | 47.986938s | `545a9b80-e283-45b9-bb91-29339f6e5e9c` | Complete |
| 02 | `assets/audio/heygen-marcus/02-expiry.wav` | 47.072653s | `d207decd-0298-449d-8439-e2b038a8a4e6` | Complete |
| 03 | `assets/audio/heygen-marcus/03-strike.wav` | 46.367347s | `7e8b2e9f-655f-4b2c-99f0-062bac8c3260` | Complete |
| 04 | `assets/audio/heygen-marcus/04-repetition.wav` | 43.441633s | `c6950afc-e4aa-4f05-b20c-13882556ee9f` | Complete |
| 05 | `assets/audio/heygen-marcus/05-vol-oi.wav` | 50.938776s | `48090ce1-3488-4287-81b9-b41ccfc7c6e6` | Complete |
| 06 | Pending | — | — | Blocked by HeyGen TTS credits |
| 07 | Pending | — | — | Blocked by HeyGen TTS credits |
| 08 | Pending | — | — | Blocked by HeyGen TTS credits |

The exact scripts for segments 06–08 are in `SCRIPT.md`. Generate only those
three segments after credits are available, using the same Marcus voice and
speed setting.

## Remaining work

1. Generate HeyGen Marcus segments 06–08 only.
2. Place them at the starts of scenes 06–08 in ChatCut when credits are
   available.
3. Replace script-derived cues with word-timed captions after the remaining
   narration is assembled.

## Known blockers

- HeyGen returned `insufficient_credit` for segments 06–08.
- ChatCut music generation also returned insufficient credits, so the existing
  approved Academy background track is reused instead.
- Do not start a final ChatCut export until all eight narration segments are
  present and the high-quality picture master has replaced the draft.
