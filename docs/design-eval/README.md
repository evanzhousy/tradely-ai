# Design eval loop

Tradely follows the same *method* as Vercel's public `design.md` work: one in-repo contract, a bounded stylesheet, and a frozen scenario that we rerun after design changes. We do not use Vercel's file, Geist, or `vbg-*` primitives as Tradely's brand.

## Loop

1. Freeze a real reader task and its inputs (`homepage.md`).
2. Keep the previous first-attempt screenshots as baseline.
3. Change `DESIGN.md`, `desk.css`, or the page, not an ad-hoc restyle of one render.
4. Run `pnpm --filter web test` so mechanical checks move with the contract.
5. Score light and dark, desktop and mobile, against the scenario rubric.
6. If a correction repeats, encode it as an observable rule, a `desk-*` primitive, or a contract test.

## Scenarios

- [Homepage](./homepage.md): first frozen artifact.
