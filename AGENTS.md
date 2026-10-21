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

- BM Cast app lives in `src/bmcast/` as a client-only SPA loaded by `BmCastApp` from the `/`, `/play/$slug`, `/tv/$slug` routes — it depends on localStorage/fullscreen APIs, so it must never render during SSR.
- Light mode remaps hardcoded dark utility classes via `html.light .app-shell ...` rules in `src/styles.css`; wrap anything that must stay dark (TV previews) in `.keep-dark`.
- Contact input normalization belongs in the browser-safe contactFormatting module so editing and persistence use the same rules.
