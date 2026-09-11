# Lesson 10: volume and open interest — SVG review

The Learn stage of `session-flow-vs-structure` now has three interactive SVG scenes. The OI model owns contract accounting and cohort comparisons; authored ledgers and reports remain server-only. The existing engine continues to own grading and progress.

## Teaching interactions

1. **Open, close and transfer.** Both supplied position flags determine the OI effect: open/open adds contracts, close/close removes them, and either mixed direction leaves OI unchanged. Every selected execution contributes its quantity once to volume. Quantity controls and explicit playback explore the four combinations from the same starting OI.
2. **Two ledgers and a report.** The session includes 10 open/open contracts, four close/close, six transfers and two exercised contracts with their paired assignments. Volume reaches 20; calculated OI moves 100 → 110 → 106 → 106 → 104. Exercise and assignment are counted as one removal event, adding no tape volume. Reported OI stays at 100 with its original date until the supplied later report publishes 104. Hiding position flags and clearing details removes the calculated OI while preserving volume and separately observed reports.
3. **Same label, different members.** The rolling 14–30 calendar-DTE group changes from expiries A/B to B/C. Its OI total rises from 200 to 420 entirely through entry/exit membership in this example; each individual series report is unchanged. The fixed first-report membership stays A/B and totals 200 on both dates. Neither stable series OI nor a changed group total identifies gross trades, owners or purpose.

The session ledger uses the $80 call series. The cohort example uses a separate $85 call strike, so its reported values cannot contradict the single-series replay at the same report date. All examples are fictional, with explicit dates, contract scope and units. Expiration is acknowledged as another removal mechanism but is not an event in this non-expiring session ledger.

## Access and assessment

- Authored values live in `oi-concept.server.ts` and cross only the authorized Learn projection. The lab rejects absent or mismatched teaching data.
- Version 2 grading remains unchanged: guided volume 25, ending OI 507 and `no` for volume alone establishing ending OI. The existing practice flow/structure explorer still displays the reported OI of 500 independently of its volume replay.
- Scene controls send no assessment actions. Continue to practice uses the existing transition. Anonymous public practice still rejects this paid lesson.
- The separate component preview renders the real `LearningScreen` with synthetic records and no account/database/billing/analytics connection. It is excluded from the production app build.

## Verification

- Learning, domain, content and server regressions: **33 files, 260 tests passed**. Ten focused tests also passed.
- Type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed. Production server output contains the corrected cohort scope; the authored contract and cohort markers are absent from client JavaScript.
- Tests cover all four position-effect combinations, report publication timing, missing flags, paired exercise counting, fixed/rolling membership, inclusive DTE boundaries, missing versus empty reports, native inputs, resets, Chinese controls, projection and existing grading.
- Desktop browser: transfer volume +10 with OI change 0; both closing OI −10. The session produced volume 20/calculated OI 104 while reported OI stayed 100. Prints-only mode removed the calculation; the next report independently showed 104 dated June 3. Rolling selection showed B/C and total 420 (+220); fixed selection showed A/B and total 200 (0).
- At 390px, all Chinese dark-mode scenes fit without horizontal overflow or SVG text outside the viewBox. Reduced motion stayed off during pointer input. Keyboard ArrowRight advanced the SVG ledger timeline to volume 10 while reported OI remained 100. Continue to practice opened the existing volume question.
- Review caught a synthetic identity mismatch between the single-series report and the cohort example. The cohort strike was separated, the build refreshed, and final GIF evidence re-recorded with the corrected scope.

- The production-built route at `http://127.0.0.1:8252/learn/session-flow-vs-structure` showed the paid-lesson sign-in/access message for the anonymous browser, with no lab or authored contract in the document. Paid-account persistence was covered by server regressions; no live authenticated paid-account session was used.
- The corrected final recording reported no exceptions or browser log errors.

## Evidence

The GIF records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=session-flow-vs-structure&lang=en&theme=light`. It is not a deployed or authenticated paid-account recording.

[Lesson 10 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-10-interactive-evidence.gif)

The reviewed export is 28.13 seconds, 784 × 1080 pixels, 225 frames and 395,439 bytes. A contact sheet decoded from the final GIF was visually checked.

The adjacent `lesson-10-evidence-frames/capture.json` contains the corrected capture URL, frame timestamps, observed values and browser errors. The GIF is assembled directly from browser frames, without reconstructing the interface.

The lesson retains its [OIC open-interest reference](https://www.optionseducation.org/news/open-interest-why-it-matters), including the distinction between trading volume, position effects and exercised/assigned contract removal.

No push or deployment was performed.
