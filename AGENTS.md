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
- Keep lead validation and encoded WhatsApp messages in `src/lib/lead.ts` and never claim website storage; this project has no lead-storage service.
- Key assessment and variant-selector state by device identity; this prevents answers or selections leaking across model and variant changes.
- Preserve Nitro auto-detected deployment presets for the existing Vercel target, with sandbox dependency filesystem access in development; this repairs preview loading without changing production hosting.
