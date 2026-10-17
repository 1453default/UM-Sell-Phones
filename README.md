# Sell Your Phone — USED MOBILES

Standalone site where customers select brand → model → storage/RAM variant and see the
"Get up to" price, complete a conditional device assessment, review an estimated offer,
and hand off their enquiry through WhatsApp. The direct "Check Exact Value" handoff is retained.

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
npm test          # valuation, lead, catalog and route regression tests
```
`src/routeTree.gen.ts` is regenerated automatically by the router plugin.

## Structure
- `src/routes/` — `/` landing page, `/sell-phone`, `/sell-phone/$brand`, `/sell-phone/$brand/$model`, `/sell-phone/$brand/$model/$variant`
- `src/components/public/` — header, footer, mobile dock, brand tagline
- `src/components/sell/SellParts.tsx` — breadcrumbs, search box, phone image component
- `src/components/sell/DeviceAssessment.tsx` — staged condition assessment, review, and contact form
- `src/lib/valuation.ts` — single condition matrix, category caps and overlap rules
- `src/lib/lead.ts` — Indian mobile validation and encoded WhatsApp handoff
- `src/data/sellPhoneCatalog.generated.json` + `sellPhoneCatalog.ts` — brands, models, image paths
- `src/data/dofyPriceCatalog.generated.json` + `sellPhonePricing.ts` — price catalog (brand + model + storage/RAM match)
- `public/sell-phone/logos/*.webp`, `public/sell-phone/phones/<brand>/<model>.webp` — local catalog images (1330 phone models across 22 brands)
- `public/about-device-questions/P1–P5/` — images for device condition questionnaire
- `reference/` — documentation, catalog source references, and condition question assets
- `scripts/` — catalog maintenance and verification scripts (Python 3)

## Deploy on Vercel
New Vercel project from this repo · Framework: Other · Install: `npm install` · Build: `npm run build`.
Nitro detects Vercel automatically. For other hosts set `NITRO_PRESET` (e.g. `netlify`, `node-server`).

## Production identity and enquiries
No production domain is known yet. Do not set a preview canonical URL. Once the Vercel
domain is confirmed, add canonical URLs and a domain-specific sitemap. All content routes
currently have distinct titles, descriptions and social metadata; bundled photos intentionally
do not produce relative `og:image` URLs.

There is no lead-storage backend. Contact details remain in page memory and the prepared
WhatsApp message; customers must send that message in WhatsApp. Nothing is claimed saved.
Assessment answers survive Previous/Continue within the page, but reloads intentionally restart.
