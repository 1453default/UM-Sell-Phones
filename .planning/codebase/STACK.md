---
last_mapped_commit: f2cb2a1d03cde0c6cdc105338394bcc1fed0bcff
last_mapped_at: 2026-10-18
---
# Technology Stack

**Analysis Date:** 2026-10-18

## Languages

**Primary:**
- TypeScript 5.8.3 - Core application logic, routing, UI components, server functions (`tsconfig.json` target ES2022)

**Secondary:**
- Python 3.x - Catalog generation, pricing sync, and verification scripts (`scripts/*.py`)
- CSS (Tailwind v4) - Theme design tokens, styles, layout utilities (`src/styles.css`)
- JSON - Static device catalog and pricing data (`src/data/*.json`)

## Runtime

**Environment:**
- Node.js v24.15.0 (Vite 8 development runtime & SSR bundle execution)
- Nitro 3.0.260603-beta - Server runtime adapter for standalone/Vercel/Cloudflare deployments

**Package Manager:**
- npm 11.12.1
- Lockfile: `package-lock.json` present; `bun.lock` / `bunfig.toml` preserved for Lovable sandbox compatibility

## Frameworks

**Core:**
- React 19.2.0 - UI component rendering (`package.json`)
- TanStack Router 1.170.41 - Type-safe file-based client/server routing (`src/routes/`, `src/routeTree.gen.ts`)
- TanStack Start 1.168.60 - Full-stack SSR and server functions (`createServerFn` in `src/lib/pickup.functions.ts`)

**UI & Styling:**
- Tailwind CSS 4.2.1 (`@tailwindcss/vite`, `tw-animate-css`) - Modern CSS engine with `@theme` block in `src/styles.css`
- Radix UI Primitives - Accessible UI components (Dialog, Accordion, Select, Popover, Slider, etc.)
- Lucide React 0.575.0 - Icon set
- Framer Motion 12.40.0 - Micro-interactions and animated state transitions
- Sonner 2.0.8 - Toast notification system
- Vaul 1.1.2 - Drawer components

**Testing:**
- Vitest 5.0.5 - Unit and integration testing test runner (`vitest.config.ts`)
- Testing Library Jest DOM 7.0.1 & JSDOM 26.1.0 - DOM testing environment

**Build/Dev:**
- Vite 8.0.16 - Dev server and bundler
- `@lovable.dev/vite-tanstack-config` 2.26.7 - Config wrapper ensuring Nitro server entry and sandbox compatibility (`vite.config.ts`)
- Drizzle ORM 0.x & Drizzle Kit 0.x - PostgreSQL schema and database migrations (`drizzle.config.ts`, `drizzle/`)

## Configuration

**Key Config Files:**
- `vite.config.ts` - Lovable Vite + TanStack Start configuration
- `tsconfig.json` - Path alias `@/* -> ./src/*`, strict mode, bundler module resolution
- `eslint.config.js` - ESLint 9 flat configuration with React and Prettier plugins
- `vitest.config.ts` - Vitest test configuration with path aliases
- `drizzle.config.ts` - PostgreSQL migration config pointing to `drizzle/schema.ts`
- `components.json` - shadcn/ui configuration metadata

---

*Stack analysis: 2026-10-18*
