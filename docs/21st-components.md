# 21st community components across Tradely

Updated: September 9, 2026.

The shared UI package owns reusable presentation. Routes and learning features continue to own content, navigation, authentication, billing, exercise state and persistence.

## Sources and adaptations

Components were discovered through [21st.dev](https://21st.dev/community/components), including its [Magic UI collection](https://21st.dev/@dillionverma/library/magic-ui) and [shadcn/ui collection](https://21st.dev/@shadcn/library/shadcn-ui). The 21st `/r/` endpoint required authentication in this session. Public source was retrieved through the authors' official registries using the shadcn CLI. No authenticated registry code or credentials were extracted.

| Community component | Source and local implementation | Where it is used |
| --- | --- | --- |
| [Dot Pattern](https://21st.dev/@dillionverma/components/dot-pattern) | `@magicui/dot-pattern` → `packages/ui/src/components/dot-pattern.tsx` | Course, guides, pricing, legal, sign-in and error openings |
| [Animated Circular Progress Bar](https://21st.dev/@dillionverma/components/animated-circular-progress-bar) | `@magicui/animated-circular-progress-bar` → `circular-progress.tsx` | Course progress overview |
| [Interactive Hover Button](https://21st.dev/@dillionverma/components/interactive-hover-button) | `@magicui/interactive-hover-button` → `interactive-hover-button.tsx` | Home, course and guide links; free pricing entry; sign-in submit |
| [Bento Grid](https://21st.dev/@dillionverma/components/bento-grid) | `@magicui/bento-grid` → `bento-grid.tsx` | Illustrated guide cards, guide next steps, free pricing card |
| [Breadcrumb](https://21st.dev/@shadcn/components/breadcrumb) | `@shadcn/breadcrumb`, Base UI/Luma → `breadcrumb.tsx` | Lessons, guides, all four legal documents and house viewer |
| [Empty](https://21st.dev/@shadcn/components/empty) | `@shadcn/empty` → `empty.tsx` | Search results, 404 and route error states |
| [Tabs](https://21st.dev/@shadcn/components/tabs) | `@shadcn/tabs`, Base UI/Luma → `tabs.tsx` | All/free/completed curriculum filters |
| [Skeleton](https://21st.dev/@shadcn/components/skeleton) | `@shadcn/skeleton` → `skeleton.tsx` | Route and account loading |
| [Item](https://21st.dev/@shadcn/components/item) | `@shadcn/item`, Base UI/Luma → `item.tsx` | Lesson rail and sign-in feature list |
| [Kbd](https://21st.dev/@shadcn/components/kbd) | `@shadcn/kbd` → `kbd.tsx` | House viewer keyboard instructions |

Reading progress follows the [21st scroll-progress pattern](https://21st.dev/@skyleen77/components/scroll-progress), with the implementation adapted from the separately retrieved [`@magicui/scroll-progress`](https://magicui.design/docs/components/scroll-progress) source. Its local implementation is `apps/web/src/components/scroll-progress.tsx`; it measures the article rather than the footer or recommended guides.

`PageIntro`, `CourseCatalog`, `TableOfContents`, and `StepIndicator` are Tradely compositions. The table of contents follows [21st's documentation-layout guidance](https://21st.dev/blog/docs-site-components); it uses real anchors and progressive scroll tracking. These compositions are not presented as verbatim registry installs. Existing Accordion, Badge, Button, Card, Field, Input, Progress, Sheet, Table and other shared shadcn controls remain in use throughout the app.

## Product adaptations

- Replaced upstream raw colors with Tradely's semantic tokens. Warm paper surfaces, readable yellow actions, coherent focus rings and dark mode apply to the entire application.
- The dot pattern uses one static SVG tile. It does not allocate hundreds of animated nodes, choose random values during rendering or load Motion.
- Progress comes from actual course data, clamps invalid percentages, and exposes an accessible label/value. Compact lesson rails retain linear progress.
- Hover actions retain a visible label. Navigation renders actual anchors, and form actions render native buttons. Touch, keyboard and reduced-motion users can use every action without hover.
- Bento content and actions are always visible. The lesson-specific diagrams are reused rather than replaced by generic artwork. Their existing pause and reduced-motion behavior remains intact.
- Curriculum filters preserve source order and access metadata. Only matching module anchors are shown. Clearing a search restores the full curriculum; stored completions are not changed.
- The lesson rail reveals the current lesson by scrolling only its own viewport. Exercise steps derive from `stepKinds`; the stepper never advances or grades work.
- Guide and legal reading layouts keep the original content and stable anchor targets. Sign-in still uses the existing Google and email-code flows. Pricing still uses the server's offers and existing checkout/recovery handlers.
- No new production dependency is required. Registry imports were normalized to the existing UI package and Base UI primitives.

## Design review

| Before | After | Why |
| --- | --- | --- |
| Full-width course start action and a basic progress bar | Content-sized action, circular progress and sourced course facts | Make the next action and current place easier to see |
| 36 lessons with module links only | Search, keyboard-operable tabs and matching module links | Make the expanded curriculum easier to browse |
| Text-only guide cards | Bento cards with existing subject diagrams | Show the concept before opening the guide |
| Loose guide and legal navigation | Breadcrumbs, an active contents rail and article reading progress | Support longer reading and deep links |
| Small isolated sign-in card | Responsive account layout with form steps and a clear reading order | Keep the authentication task understandable on desktop and mobile |
| Plain error text and spinner | Branded empty states and stable skeleton layouts | Make loading and recovery feel part of the same product |

## Licenses

Adapted Magic UI and shadcn/ui source is MIT licensed. Copyright and permission notices are retained in [third-party-ui-licenses.md](./third-party-ui-licenses.md).
