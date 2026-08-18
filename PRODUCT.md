# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Tradely serves option traders who want a structured path from market concepts to practical analysis. Learners have independent Tradely accounts and may or may not also be TradingFlow customers.

## Product Purpose

Tradely is a video-led options learning hub. It organizes lessons into an ordered curriculum, records individual lesson progress, and gives learners clear practice assignments in TradingFlow, the partnered external options-analysis product.

Success means a learner can understand a concept, see it demonstrated, practice the corresponding workflow in TradingFlow, and resume the Tradely curriculum without losing their place.

## Positioning

Tradely connects options education to an actual analysis workflow. Lessons do not stop at definitions: each relevant lesson ends with a bounded "Practice with TradingFlow" task and a deep link to the appropriate TradingFlow surface.

## Operating Context

- Canonical production domain: `tradely.ai`.
- Tradely and TradingFlow are independent products with separate domains, customers, authentication, billing, databases, and infrastructure.
- TradingFlow is a design reference and official partnered practice tool, not a shared account system.
- Course videos and source lesson material are available in `/Users/evansmacbookpro/Desktop/Projects/tradingflow-web-landingpage` under the partnership.
- TradingFlow application and design-system source are available in `/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack` for authorized reference.

## Capabilities and Constraints

- Full-stack framework: TanStack Start with React and TypeScript.
- Identity: a dedicated Tradely Clerk application.
- Billing: a dedicated Tradely Stripe account using Checkout and live Stripe access checks.
- Persistence: a dedicated Neon PostgreSQL database accessed through Drizzle.
- MVP persistence is intentionally limited to `app_user` and `lesson_progress`.
- Courses, modules, lessons, ordering, access requirements, and prerequisites are version-controlled content, not database tables.
- No quiz system in the MVP.
- Paid lesson bodies are authorized on the server; client-side lock presentation is not authorization.
- Tradely does not exchange Clerk IDs, Stripe Customers, database records, or private user data with TradingFlow.
- TradingFlow outbound links carry only non-PII course attribution.
- TradingFlow accounts or subscriptions may be required separately and must be described honestly.

## Brand Commitments

- Product name: Tradely.
- Domain: `tradely.ai`.
- Tradely has its own logo and primary identity.
- The application adapts TradingFlow's authorized base-luma component language, semantic token architecture, typography discipline, borderless elevated surfaces, data-encoding colors, and critically damped motion.
- TradingFlow branding appears only in explicit partner/practice contexts, never as Tradely's main identity.

## Evidence on Hand

- TradingFlow design contract: `/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack/DESIGN.md`.
- TradingFlow theme tokens and primitives: `/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack/src/index.css` and `src/components/ui/`.
- Existing English and Chinese tutorial series: `/Users/evansmacbookpro/Desktop/Projects/tradingflow-web-landingpage/content/series/tradingflow-docs/`.
- Existing videos, chapter cards, posters, app captures, and illustrations: `/Users/evansmacbookpro/Desktop/Projects/tradingflow-web-landingpage/public/` and `video/`.
- No Tradely customer testimonials, outcome claims, pricing, or deployment evidence has been supplied. The product must not fabricate them.

## Product Principles

1. Teach a decision workflow, not isolated terminology.
2. Use TradingFlow for real practice rather than building toy analysis tools inside Tradely.
3. Keep identity, billing, persistence, and partner boundaries explicit.
4. Minimize persistent concepts and derive curriculum state from version-controlled content.
5. Preserve evidence, uncertainty, and risk language appropriate for options education.

## Accessibility & Inclusion

The web experience must support keyboard navigation, visible focus, semantic headings, captions or transcripts for instructional video, WCAG AA contrast, reduced motion, and responsive use on desktop and mobile.
