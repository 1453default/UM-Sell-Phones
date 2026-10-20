# USED MOBILES

<<<<<<< HEAD
Customer-facing used-phone catalog and doorstep pickup request site for the Hyderabad shop. Customers select an exact model and storage variant, complete a condition assessment, see an estimated offer, and can submit a pickup request. The server validates the request, looks up the same exact static catalog variant, recalculates the estimate, and saves the request.

## Project status

The code includes Supabase-backed pickup storage and an admin request panel. A hosted database, Auth configuration, email sender, and production deployment were not verified from this checkout. Apply the migrations and complete the launch checklist below in staging before production.

The price catalog has **22 brands, 1,329 models, 2,559 variant records, 1,130 priced models, and 199 models without a usable price**. Unpriced models retain the call-for-offer path. The active price snapshot is dated **6 October 2026**; review its freshness before launch. No prices are fetched or fabricated at runtime.

## Stack and structure

- TanStack Start and React, with file routes in `src/routes/`.
- `@lovable.dev/vite-tanstack-config` and the existing server entry. The wrapper supports Lovable builds and Nitro host detection outside Lovable.
- Supabase Auth and Postgres for administrator access and pickup requests.
- `src/lib/valuation.ts` contains the shared condition matrix, caps, overlap rules, and nearest-₹100 display rounding.
- `src/data/sellPhoneCatalog.generated.json` and `src/data/dofyPriceCatalog.generated.json` are the static catalog and exact price snapshot.
- `src/lib/pickup.ts` holds pickup rules and server input validation; `src/lib/pickup.functions.ts` exposes protected server functions.
- `drizzle/migrations/` contains the database migrations. Do not edit an already-applied migration; add a new numbered migration.

## Local setup

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run catalog:verify
npm run build
```

`npm run lint` runs ESLint and the configured Prettier rule. The generated Supabase preview-auth adapter is excluded because its source comment says not to edit it directly. Existing Fast Refresh warnings remain visible in the lint output.

Copy `.env.example` to `.env` and fill in the values for a local or staging project. The `VITE_` Supabase URL and publishable key are public browser configuration. The service-role key, Resend key, database connection string, and rate-limit secret are server-only. Never add `VITE_` to those secrets.

Required Supabase values:

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for the browser build.
- `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for server-side Auth checks.
- `SUPABASE_SERVICE_ROLE_KEY` for validated server-only writes and outbox processing.
- `LOVABLE_DB_MIGRATION_URL` for the direct PostgreSQL connection used by Drizzle migrations.

The server validates missing Supabase variables and reports their names without logging secret values. Keep the service-role key only in the server runtime environment.

## Database setup

Apply migrations in order to a disposable or staging Supabase project first. Migration `0002_secure_admin_and_pickup_outbox.sql` removes the first-account admin trigger and function while preserving every existing `user_roles` row, adds a server-only rate-limit bucket, and adds a durable email outbox. The pickup insert and outbox insert are committed in one database transaction.

With `LOVABLE_DB_MIGRATION_URL` set to the staging database's direct PostgreSQL connection string:

```powershell
$env:LOVABLE_DB_MIGRATION_URL = "<staging direct connection string>"
npx drizzle-kit migrate
Remove-Item Env:LOVABLE_DB_MIGRATION_URL
```

After applying, verify in the Supabase SQL Editor that:

1. `on_auth_user_created_admin` and `public.grant_first_admin()` are absent. Existing administrator rows remain in `public.user_roles`.
2. `pickup_notification_outbox` and `pickup_rate_limit_buckets` exist with RLS enabled.
3. `create_pickup_request_atomic` and `claim_pickup_notification` are executable only by `service_role`.
4. A staging pickup creates exactly one request and one pending outbox row, and repeating the same submission key returns the same reference.
5. A non-admin cannot list pickup requests or notification status; an admin can.

Do not run migrations against production as part of this code change. Back up the project and review the staging results before a production migration.

## Administrator access

Public user sign-up is not an administrator provisioning mechanism. `supabase/config.toml` disables sign-up for the local Supabase stack; verify the hosted Supabase Auth setting **Allow new users to sign up** is also off before launch. Supabase project settings are not changed by this repository migration.

To provision the first or any subsequent staff administrator:

1. In the trusted Supabase Dashboard, use **Authentication → Users → Add user → Send invitation**.
2. After the invitee exists, use the owner-only SQL Editor to grant the role. This explicit step is required for the first administrator too; account creation never grants a role automatically.

   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'admin'::public.app_role
   from auth.users
   where lower(email) = lower('<invited staff email>')
   on conflict (user_id, role) do nothing;
   ```

3. Sign in through `/auth` and verify access to `/admin`. Remove access by deleting only that user's `admin` row from `public.user_roles`.

The UI is not the authorization boundary. Each admin server function checks `has_role`, and database policies restrict authenticated request reads and updates to administrators.

## Pickup submissions and abuse controls

The public server function validates the request size and fields, exact catalog model and variant, answers, address, pincode, and available pickup slot. It recalculates the offer from the static exact variant price; client-supplied prices are not accepted. A hidden honeypot rejects basic bots.

Postgres applies a persistent, concurrency-safe token bucket keyed by an HMAC of the validated mobile number. It starts with five tokens and refills one every twelve minutes. Identical submission-key retries return the saved record without consuming another token. The raw IP address and arbitrary forwarded-IP headers are not used. A hosting-edge/IP limit may still be useful, but must be configured only after the deployment host and its trusted proxy behavior are confirmed.

## Administrator email notifications

New pickup requests automatically create an outbox row in the same Postgres transaction as the request. The server then attempts an administrator alert through the Resend Email API. The email includes the booking reference, submitted time, customer contact and pickup details, exact device and variant, selected condition summary, and server-calculated estimate. Customer input is escaped in HTML, with a plain-text alternative. The recipient can only come from server configuration. Delivery is attempted inline after the database commit; there is no scheduled background worker. If the server stops after commit but before sending, the durable outbox row remains pending for an administrator to retry from `/admin`.

Set these server-only variables:

- `RESEND_API_KEY`
- `ADMIN_NOTIFICATION_EMAIL`
- `EMAIL_FROM`

Create a Resend account, verify the sender domain or address that will be used for `EMAIL_FROM`, and set all three values in a development or staging runtime. Do not assume a free plan or verified sender. No real email was sent during local implementation.

Resend receives a stable `pickup-request/<request UUID>` idempotency key. A provider rejection is recorded as a failed notification and can be retried by an administrator from `/admin`. A timeout or server-side error with an uncertain outcome is recorded as unknown and is not retried blindly. Resend documents a 24-hour idempotency retention window; the app only reclaims a stale sending attempt within 23 hours. A `sent` status means Resend accepted the message, not that it reached the inbox. Requests remain saved if email configuration or delivery fails.

Existing requests are not backfilled into the outbox, so they do not produce unsolicited email. The outbox stores the request ID and delivery status, not a second copy of customer details.

## Catalog checks and pricing

`npm run catalog:verify` checks model identity, exact price-row association, duplicate variants, invalid prices, missing images, and the generated summary. To regenerate only the counts and snapshot metadata after a reviewed source-data change, run `npm run catalog:summary` and inspect the summary-only diff.

The older `scripts/generate_dofy_dataset.py` exports its research JSON under `reference/source-catalog/`; it no longer writes to the active Cashify price snapshot. Update the active price data only from an approved, reviewed source snapshot.

The exact selected variant's `uptoPrice` is both the valuation base and a strict maximum. The existing condition formula and nearest-₹100 rounding stay unchanged; after rounding, the displayed and saved offer is capped at that variant's exact maximum. For Apple iPhone 13 128 GB, the healthy estimate is therefore ₹25,760 rather than the rounded ₹25,800.

## Privacy and business review

The privacy page describes pickup data, Supabase, conditional Resend processing, and Google Fonts. The business has not supplied a retention period. The terms page also records that cancellation fees/deadlines and dispute handling are not defined. The owner must review and approve those policies before presenting the pages as final.

## Vercel deployment

Vercel is the production target. `vite.config.ts` keeps the Lovable/TanStack wrapper and existing server entry, and pins Nitro to its Vercel preset for builds outside Lovable. `vercel.json` declares the TanStack Start framework so Vercel can detect the project. Current TanStack guidance uses Nitro for Vercel and recommends this framework declaration; see the [TanStack hosting guide](https://tanstack.com/start/latest/docs/framework/react/guide/hosting) and [Vercel TanStack Start guide](https://vercel.com/docs/frameworks/full-stack/tanstack-start).

Import the repository into Vercel and use the detected `npm run build` command. Add browser variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, plus server-only `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PICKUP_RATE_LIMIT_SECRET`, `RESEND_API_KEY`, `ADMIN_NOTIFICATION_EMAIL`, and `EMAIL_FROM` in Vercel project settings. Set `LOVABLE_DB_MIGRATION_URL` only in a trusted migration environment; do not expose it as a browser variable. Never prefix server secrets with `VITE_`.

The local default build previously selected `cloudflare-module` because the Lovable wrapper uses that as its fallback preset outside a hosting environment. The explicit Vercel preset and local Vercel-target build remove that ambiguity. A successful local target build is not a deployment or a live Vercel runtime test; configure a Vercel Preview environment and verify auth, pickup persistence, email status, and admin actions before production.

## Launch checklist

- Apply and verify all migrations in staging, then review and schedule the production migration separately.
- Verify hosted public signup is disabled and invited staff have only their approved roles.
- Configure the production Supabase public values and server-only service-role key.
- Configure and verify the Resend sender and admin recipient; send a staging notification and check both its status and mailbox.
- Confirm the price snapshot is current; offers use `uptoPrice` as a strict maximum.
- Approve the privacy retention statement and cancellation/dispute terms.
- Choose the deployment target and verify its server runtime, secrets, routes, and production smoke test.
- Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run catalog:verify`, and `npm run build` on the final branch.
=======
A storefront for customers to find an exact phone model and storage/RAM variant, review an estimated offer, complete a device assessment, and request a free doorstep pickup in supported Hyderabad pincodes.

## Stack

- TanStack Start with React 19 and file-based routes in `src/routes`
- Vite 8, Tailwind CSS v4, and Nitro
- Supabase Auth and Postgres for staff access and pickup request storage
- Drizzle SQL migrations in `drizzle/migrations`

The public site has no account creation flow. Staff sign in at `/auth`; access to `/admin` is checked against the `user_roles` table on the server. Customer phone verification by SMS/OTP is disabled. Pickup submissions are validated and their estimate is recomputed on the server before storage. The confirmation page displays a booking reference; it does not imply that the pickup time or final purchase price is guaranteed.

## Local setup

```bash
npm ci
cp .env.example .env
# Fill the server-side Supabase settings described below
npm run dev
```

Commands:

```bash
npm run build       # production bundle
npm run preview     # serve the production bundle
npm run typecheck   # TypeScript check
npm test            # valuation, pickup, catalog, route and configuration checks
```

`src/routeTree.gen.ts` is generated by the router plugin.

## Supabase setup

Use the existing Supabase project configured for this application. Apply the SQL files in `drizzle/migrations/` in filename order using the Supabase SQL editor or your established migration workflow. The migrations create the role and pickup request tables, row-level security policies, admin role check, and unique retry key.

For the existing Supabase project, the public URL and publishable key have committed fallbacks shared by browser and server auth. The only required secret for accepting pickup requests is:

- `SUPABASE_SERVICE_ROLE_KEY` — secret service-role key; server use only. Never add it to a `VITE_` variable or browser bundle.

To use a different Supabase project, set matching `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` server variables and `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` build variables. The publishable key is public; the service-role key is not.

Staff accounts must be provisioned through Supabase's secure invitation process. The database migration assigns the initial administrator role through its auth-user trigger. Confirm the intended first administrator account before enabling staff invitations. No customer signup or SMS provider is configured.

## Deployment

The app uses Nitro for deployment. Vercel detects TanStack Start and selects its Vercel runtime during hosted builds; the local build may select a development or sandbox preset. Confirm the Vercel project uses the TanStack Start framework preset and check its deployment build logs after connecting the repository. The hosting account, pickup storage secret, database migrations and custom domain must be configured outside this repository.

Before accepting bookings, configure the Supabase server variables, apply the migrations, and submit a booking in the deployed environment. Hosting credentials and database provisioning are deployment setup; this repository does not contain secret values.

## Domain and legal readiness

The current canonical origin defaults to `https://umsp.vercel.app`. When a custom domain is confirmed, attach it to Vercel and set `VITE_SITE_URL` to that origin for the production build. Do not use a preview URL as the canonical domain. A sitemap can be added after the final domain and indexable routes are confirmed.

Privacy and terms pages are included at `/privacy` and `/terms`. Their current text identifies the data stored and booking flow, and calls out retention and business-policy details that still need confirmation. Have the business review those details before publishing.

## Project structure

- `src/routes/` — landing page, device catalog routes, staff sign-in, admin, privacy and terms
- `src/components/public/` — shared layout, header, footer and brand logo
- `src/components/sell/` — catalog, device assessment and pickup form
- `src/lib/valuation.ts` — condition matrix, caps and estimate calculation
- `src/lib/pickup.ts` and `pickup.functions.ts` — pickup validation and server-side persistence
- `src/data/` — exact brand/model/variant catalog and pricing data
- `drizzle/migrations/` — database schema and access-control migrations
- `public/` — catalog imagery, brand logo and browser icons
- `reference/` — catalog sources and maintenance documentation
- `scripts/` — catalog maintenance and verification scripts
>>>>>>> 82b3de4d68f96599d8612343ab3e124a89323dea
