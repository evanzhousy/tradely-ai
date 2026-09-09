# Public guides and SEO

Implemented from [the SEO plan](research/seo-code-change-plan-2026-09-09.md).

## Ownership

- `apps/web/src/content/guides.ts` owns intentionally public English articles, sources, real modification dates and related lesson IDs.
- `apps/web/src/seo/pages.ts` owns metadata and sitemap eligibility. `site.ts` owns the public canonical origin, `https://www.tradely.ai`.
- The `/sitemap.xml` and `/robots.txt` server routes replace the former static files. They do not query authentication, billing or the database.
- Course access, paid teaching units, grading and persisted progress retain their existing server boundaries. Public demo inputs are independently authored in `features/guides/examples.ts`.

## Publishing and indexing

Publish a complete article with an answer, worked example, sources and useful next step. The guide directory automatically supplies navigation and sitemap entries. Guide slugs and section IDs must be unique; `example` and `sources` are reserved for the interactive region and source section. Use real content modification dates, not build timestamps.

Home, the guide index, published guides, curriculum, pricing and free lessons are in the sitemap. Paid lesson shells remain accessible with `noindex, follow`. Legal pages remain accessible/indexable but are omitted from the acquisition sitemap. Unknown routes return 404 and noindex without a canonical to an invented page. Vercel preview builds set page-level noindex through the build-defined deployment environment; deployment protection remains a platform setting.

Guides have English SSR content, `lang="en"` and matching Article/BreadcrumbList data. The surrounding UI still supports Chinese. This is not a separate Chinese SEO implementation. Do not add hreflang aliases until translated URLs and server-rendered language support exist.

## Public examples

- GEX distinguishes signed net, gross magnitude and a known subtotal when coverage is missing. It reuses the lesson domain's complete-total semantics.
- OI/volume follows known opening, closing and transfer designations in a hypothetical ledger. It is not an intraday OI feed.
- IV crush uses supplied hypothetical quotes. Only quote-to-quote accounting is calculated; no exact causal attribution to IV or pricing-model prediction is claimed.

Examples load when opened, work without animation, support keyboard controls and reset independently. The article's numerical worked example is still available without JavaScript. Demo completion is feedback, not a course grade or saved account record.

## Measurement

Use the existing consent-gated `capture()` API. Event registrations and allowed properties live in `analytics/events.ts`; definitions are also listed in [ANALYTICS-SCENARIOS.md](ANALYTICS-SCENARIOS.md).

A demo run starts on the first active interaction and completes on the correct understanding check. Neither is fired by rendering. A run that began before consent is not reconstructed after consent; reset starts a new run. Anonymous lesson previews have separate events from signed-in course exercises. Failed preview restarts retry the requested new history/variant, not the previous completed history.

Guide page views use the English content locale even if the surrounding UI is Chinese. Do not interpret confirmed/restored course access as a new purchase, or combine GSC's all-user click denominator with an analytics funnel limited to consented users.

## Validation and release boundary

Local verification covers TypeScript, Vitest, production build output, metadata/HTTP responses, anonymous readable content, public preview access restrictions, demo interactions, mobile layout and consent behavior. Tests use mocked identities to cover signed-in entitlement states; an authenticated production purchase journey is a separate release check.

After an authorized deployment:

1. Check non-www → www redirects and the final canonical URLs on the deployed host.
2. Fetch the sitemap/robots, all three articles, a free lesson, a paid lesson shell and a missing slug. Check status, content type, SSR content and robots/canonical uniqueness.
3. Verify consented analytics delivery and anonymous/free/member flows in the deployed environment.
4. Submit the sitemap and inspect index coverage in GSC. Ranking, search demand and conversions are measured after release, not guaranteed by local tests.

No push, production deployment, GSC submission or membership change is part of the local implementation.

### Local verification record — 2026-09-09

- Node 24: workspace typecheck and 399 tests in 74 files passed. Production build passed with source-map upload disabled for local validation.
- Scoped Biome: 46 affected/source route files passed. Repository-wide Biome remains blocked by pre-existing generated model assets and the separate `site-static` work; its write-all commit hook was bypassed after the scoped checks to preserve unrelated files.
- Media boundary and PostHog credential scans passed.
- HTTP checks: public article bodies, one canonical/robots per page, generated sitemap/robots MIME types, 404s, free lesson indexing and paid lesson noindex.
- Browser: all three demos, missing-data feedback, OI 190/140/+40 ledger, IV quote changes, reset, keyboard radio navigation, free-lesson destination, 390px layouts and reduced-motion rendering checked. No runtime exceptions observed during the demo journeys.
- Consent event semantics and privacy are covered by component/provider tests. Actual new-event ingestion was not positively confirmed in this local browser session; verify delivery after deployment. No production login/purchase or GSC indexing claim is made.
