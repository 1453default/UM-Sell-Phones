# Sell Your Phone — USED MOBILES

Standalone site where customers select brand → model → storage/RAM variant and see the
"Get up to" price, then connect to WhatsApp ("Check Exact Value") for a condition-based quote.

## Stack
TanStack Start v1 (React 19, file routes in `src/routes`), Vite 8, Tailwind CSS v4
(`src/styles.css`), Nitro for the server build. No database, no auth, no external backend dependencies.

## Commands
```bash
npm install       # install dependencies
npm run dev       # http://localhost:3000
npm run build     # production build -> .output/
npm run preview   # serve the build
npm run typecheck # verify TypeScript types
```
`src/routeTree.gen.ts` is regenerated automatically by the router plugin.

## Structure
- `src/routes/` — `/` landing page, `/sell-phone`, `/sell-phone/$brand`, `/sell-phone/$brand/$model`, `/sell-phone/$brand/$model/$variant`
- `src/components/public/` — header, footer, mobile dock, brand tagline
- `src/components/sell/SellParts.tsx` — breadcrumbs, search box, phone image component
- `src/data/sellPhoneCatalog.generated.json` + `sellPhoneCatalog.ts` — brands, models, image paths
- `src/data/dofyPriceCatalog.generated.json` + `sellPhonePricing.ts` — price catalog (brand + model + storage/RAM match)
- `public/sell-phone/logos/*.webp`, `public/sell-phone/phones/<brand>/<model>.webp` — local catalog images (1330 phone models across 22 brands)
- `public/about-device-questions/P1–P5/` — images for device condition questionnaire
- `reference/` — documentation, catalog source references, and condition question assets
- `scripts/` — catalog maintenance and verification scripts (Python 3)

## Deploy on Vercel
New Vercel project from this repo · Framework: Other · Install: `npm install` · Build: `npm run build`.
Nitro detects Vercel automatically. For other hosts set `NITRO_PRESET` (e.g. `netlify`, `node-server`).
