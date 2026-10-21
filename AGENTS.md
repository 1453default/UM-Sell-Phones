<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the existing TanStack file routes and exact static catalog/variant lookup; this preserves independent deep links and prevents similar-model pricing substitutions.
- Maintain device-condition definitions and calculation in `src/lib/valuation.ts`, independently tested from the assessment UI; this keeps percentages, caps, and overlap handling consistent.
- Pickup requests are saved via `createPickupRequest` in `src/lib/pickup.functions.ts`, which recomputes the estimate server-side from the exact catalog price; pickup rules live in `src/lib/pickup.ts` so they stay testable.
- Key assessment and variant-selector state by device identity; this prevents answers or selections leaking across model and variant changes.
- Use @lovable.dev/vite-tanstack-config with the existing server entry and sandbox dependency filesystem access; it emits Lovable's dist bundle while preserving Nitro hosting auto-detection outside Lovable.

- Admin access is the single `admin` row in `user_roles`, checked server-side with `has_role` and limited by a unique index. There is no first-account auto-admin path; provision the owner through trusted Supabase Auth tooling and assign that account's role through trusted admin tooling.

- Public pickup writes use a validated server-only privileged insert with a unique submission key; retries return the persisted reference without creating duplicate requests.
- Keep a single shared business-logo renderer and derive browser icons from its source asset to prevent branding drift.
- Public signup and email-based admin recovery are disabled; manage the fixed administrator password in Supabase Auth and never put it in source or frontend configuration. Keep administrator permissions server-validated in `user_roles`.
- Inline only public auth environment references in the generated browser client via the Vite pre-transform, with committed public fallbacks shared with server auth; hosted builds run without the env file. Pickup writes still require the server-only service-role secret. Never inline server secrets.
- The client function middleware attaches a session only when readable and never throws; public calls like pickup booking must not depend on browser auth.
- Keep route, assessment-step and confirmation motion in shared CSS with reduced-motion overrides; this keeps animation consistent without changing booking or assessment state.
