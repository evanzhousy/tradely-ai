# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Tradely serves option traders who want a structured path from market concepts to practical analysis. Learners have independent Tradely accounts and may or may not also be TradingFlow customers.

## Product Purpose

Tradely is an interactive options learning hub. Its 36-lesson curriculum connects worked explanations, guided cases, independent practice, saved research and partnered TradingFlow assignments. Current-edition interactive material is primary while replacement lesson videos are pending.

Success means a learner can explain a concept, make a bounded judgment from evidence, revise it when warranted, and apply it independently to a different case. Learners can resume saved work and optionally practice the corresponding workflow in TradingFlow.

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
- Identity: a dedicated Tradely Neon Auth application.
- Billing: Tradely-specific Stripe Checkout offers and live Stripe access checks.
- Persistence: a dedicated Neon PostgreSQL database accessed through Drizzle.
- Persistence includes `app_user`, `lesson_progress` and versioned `lesson_attempt` records. The optional coaching pilot adds `coaching_session` and `coaching_generation`; it does not create a separate mastery or entitlement system.
- Courses, modules, lessons, ordering, access requirements, and prerequisites are version-controlled content, not database tables.
- Independent numeric and choice criteria use deterministic assessment. Written work remains subject to self or human review; AI feedback never certifies mastery.
- Paid lesson bodies are authorized on the server; client-side lock presentation is not authorization.
- Tradely does not exchange Neon Auth IDs, Stripe Customers, database records, or private user data with TradingFlow.
- TradingFlow outbound links carry only non-PII course attribution.
- TradingFlow accounts or subscriptions may be required separately and must be described honestly.

## AI Practice Coaching

The optional AI practice coach works inside guided cases for `audited-boundary`, `rank-symbols` and `rank-contracts`. Learners save their reasoning, receive evidence-linked feedback, revise it and then use the existing independent case. The pilot requires a signed-in allowlisted account, preserves course access checks and offers two feedback rounds per session. It is disabled by default pending configuration and model-quality review. Pilot AI allowances do not promise unlimited lifetime AI usage with the Course Pass.

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
2. Use synthetic cases to teach and check concepts; keep live market analysis on partnered tools such as TradingFlow.
3. Keep identity, billing, persistence, and partner boundaries explicit.
4. Minimize persistent concepts and derive curriculum state from version-controlled content.
5. Preserve evidence, uncertainty, and risk language appropriate for options education.

## Accessibility & Inclusion

The web experience must support keyboard navigation, visible focus, semantic headings, captions or transcripts for instructional video, WCAG AA contrast, reduced motion, and responsive use on desktop and mobile.
