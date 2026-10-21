# USED MOBILES

Customer-facing used-phone catalog and doorstep pickup request site for the Hyderabad shop. Customers select an exact model and storage variant, complete a condition assessment, see an estimated offer, and can submit a pickup request. The server validates the request, looks up the same exact static catalog variant, recalculates the estimate, and saves the request.

## Project status

The code includes Supabase-backed pickup storage, Telegram lead alerts, and an admin request panel. A hosted database, Auth configuration, Telegram delivery, and production deployment were not verified from this checkout. Apply the migrations and complete the launch checklist below in staging before production.

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

Copy `.env.example` to `.env` and fill in the values for a local or staging project. The `VITE_` Supabase URL and publishable key are public browser configuration. The service-role key, Telegram bot token, database connection string, and rate-limit secret are server-only. Never add `VITE_` to those secrets.

Required Supabase values:

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for the browser build.
- `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for server-side Auth checks.
- `SUPABASE_SERVICE_ROLE_KEY` for validated server-only writes and outbox processing.
- `LOVABLE_DB_MIGRATION_URL` for the direct PostgreSQL connection used by Drizzle migrations.

The server validates missing Supabase variables and reports their names without logging secret values. Keep the service-role key only in the server runtime environment.

## Database setup

Apply migrations in order to a disposable or staging Supabase project first. Migration `0002_secure_admin_and_pickup_outbox.sql` removes the first-account admin trigger and function while preserving every existing `user_roles` row, adds a server-only rate-limit bucket, and adds a durable notification outbox. Migration `0004_telegram_lead_notifications.sql` preserves old email outbox history, routes new outbox rows to Telegram, and prevents blind retries after an uncertain Telegram send. The pickup insert and outbox insert are committed in one database transaction.

With `LOVABLE_DB_MIGRATION_URL` set to the staging database's direct PostgreSQL connection string:

```powershell
$env:LOVABLE_DB_MIGRATION_URL = "<staging direct connection string>"
npx drizzle-kit migrate
Remove-Item Env:LOVABLE_DB_MIGRATION_URL
```

After applying, verify in the Supabase SQL Editor that:

1. `on_auth_user_created_admin` and `public.grant_first_admin()` are absent. Existing administrator rows remain in `public.user_roles`.
2. `pickup_notification_outbox` and `pickup_rate_limit_buckets` exist with RLS enabled.
3. `create_pickup_request_atomic` and `claim_pickup_notification` are executable only by `service_role`; new outbox rows default to the `telegram` channel.
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

## Telegram lead notifications

New pickup requests create a Telegram notification outbox row in the same Postgres transaction as the request. After the commit, trusted server code sends a plain-text alert through Telegram's Bot API to the configured private employee group. The message contains the booking reference, submission time, customer contact and pickup details, device, condition summary, and server-calculated estimate. User-controlled line breaks are flattened, and no Telegram formatting mode is enabled. Delivery is attempted inline after the database commit; there is no scheduled background worker. Requests remain saved if Telegram is unavailable.

Set these server-only variables in local and production server environments:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

The bot token is never sent to browser code or logged. The Telegram API's `ok: true` response confirms acceptance, and the returned message ID is recorded in the existing `provider_message_id` field. A confirmed rejection is marked failed and can be retried from `/admin`. A timeout, server error, or stale `sending` state is treated as uncertain; it is not retried blindly because Telegram's `sendMessage` endpoint does not provide an idempotency key. Check the employee group before taking further action. Repeated submissions with the same submission key do not create another request or notification.

Existing outbox records keep their prior `email` channel and status for historical accuracy; the admin panel labels them as historical and never retries them through Telegram. New leads use Telegram only. The outbox stores the request ID, channel, and delivery status, not a second copy of customer details.

## Catalog checks and pricing

`npm run catalog:verify` checks model identity, exact price-row association, duplicate variants, invalid prices, missing images, and the generated summary. To regenerate only the counts and snapshot metadata after a reviewed source-data change, run `npm run catalog:summary` and inspect the summary-only diff.

The older `scripts/generate_dofy_dataset.py` exports its research JSON under `reference/source-catalog/`; it no longer writes to the active Cashify price snapshot. Update the active price data only from an approved, reviewed source snapshot.

The exact selected variant's `uptoPrice` is both the valuation base and a strict maximum. The existing condition formula and nearest-₹100 rounding stay unchanged; after rounding, the displayed and saved offer is capped at that variant's exact maximum. For Apple iPhone 13 128 GB, the healthy estimate is therefore ₹25,760 rather than the rounded ₹25,800.

## Privacy and business review

The privacy page describes pickup data, Supabase, Telegram processing for the private employee group, and Google Fonts. The business has not supplied a retention period. The terms page also records that cancellation fees/deadlines and dispute handling are not defined. The owner must review and approve those policies before presenting the pages as final.

## Vercel deployment

Vercel is the production target. `vite.config.ts` keeps the Lovable/TanStack wrapper and existing server entry, and pins Nitro to its Vercel preset for builds outside Lovable. `vercel.json` declares the TanStack Start framework so Vercel can detect the project. Current TanStack guidance uses Nitro for Vercel and recommends this framework declaration; see the [TanStack hosting guide](https://tanstack.com/start/latest/docs/framework/react/guide/hosting) and [Vercel TanStack Start guide](https://vercel.com/docs/frameworks/full-stack/tanstack-start).

Import the repository into Vercel and use the detected `npm run build` command. Add browser variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, plus server-only `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PICKUP_RATE_LIMIT_SECRET`, `TELEGRAM_BOT_TOKEN`, and `TELEGRAM_CHAT_ID` in Vercel project settings. Set `LOVABLE_DB_MIGRATION_URL` only in a trusted migration environment; do not expose it as a browser variable. Never prefix server secrets with `VITE_`.

The local default build previously selected `cloudflare-module` because the Lovable wrapper uses that as its fallback preset outside a hosting environment. The explicit Vercel preset and local Vercel-target build remove that ambiguity. A successful local target build is not a deployment or a live Vercel runtime test; configure a Vercel Preview environment and verify auth, pickup persistence, Telegram status, and admin actions before production.

## Launch checklist

- Apply and verify all migrations in staging, then review and schedule the production migration separately.
- Verify hosted public signup is disabled and invited staff have only their approved roles.
- Configure the production Supabase public values and server-only service-role key.
- Configure the Telegram bot token and private employee-group chat ID in the server environment; send one staging pickup and confirm Telegram and the outbox status.
- Confirm the price snapshot is current; offers use `uptoPrice` as a strict maximum.
- Approve the privacy retention statement and cancellation/dispute terms.
- Choose the deployment target and verify its server runtime, secrets, routes, and production smoke test.
- Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run catalog:verify`, and `npm run build` on the final branch.

<!-- Deployment identity verification -->
