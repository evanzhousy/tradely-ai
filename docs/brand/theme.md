# Tradely UI theme

The shared UI uses shadcn preset [`b6GfB1emu`](https://ui.shadcn.com/create?preset=b6GfB1emu): Base UI Luma, neutral surfaces, yellow accents, Inter, Lucide, default radius, and subtle menus.

`packages/ui/src/styles/globals.css` owns the light and dark tokens. Both shadcn configurations reference this stylesheet. `apps/web/src/styles/desk.css` consumes these tokens for landing-page treatments instead of defining another palette.

## Intentional extensions

- Preserve success, warning, and info tokens alongside the preset destructive color.
- Use five categorical chart hues (ochre/yellow, blue, teal, purple, orange), with separate light and dark values. Yellow fills are not suitable for small text on white; use foreground text, success indicators, and chart tokens where appropriate.
- Keep JetBrains Mono for data and code.
- The trading-hall media overlay uses the shared dark theme in either page mode so its copy stays readable over the dark 3D scene. Media backdrops, masks, and shadows retain rendering-specific colors.
- Logos and 3D assets retain their artwork colors.

To reapply the upstream theme, run `pnpm dlx shadcn@latest apply b6GfB1emu --only theme` from `apps/web`, then review the diff and restore the chart extensions. Do not overwrite customized components just to change colors.
