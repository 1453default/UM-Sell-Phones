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

- Admin access is the `admin` row in `user_roles`, checked server-side with `has_role`; the first account created is granted admin by a database trigger.

- Public pickup writes use a validated server-only privileged insert with a unique submission key; retries return the persisted reference without creating duplicate requests.
- Keep a single shared business-logo renderer and derive browser icons from its source asset to prevent branding drift.
- Staff accounts are provisioned by secure invitations, never public signup; administrator permissions remain server-validated in user_roles.
