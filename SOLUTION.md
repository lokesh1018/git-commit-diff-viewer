# Solution Notes

## Architecture

```
Browser (Vite :1234)
  └─ React route /repositories/:owner/:repository/commit/:commitSHA
       ├─ GET /repositories/.../commits/:oid        ──proxy──▶ Express (:5000)
       └─ GET /repositories/.../commits/:oid/diff   ──proxy──▶ Express (:5000)
                                                              └─ GitHub REST API
                                                                   GET /repos/{owner}/{repo}/commits/{ref}
```

- **Backend** reshapes the GitHub commit payload into the swagger `Commit` and `CombinedFileDifference` shapes. The GitHub token stays server-side only (`backend/.env`).
- **Frontend** is a single page: commit header + collapsible file diffs. Design tokens live in `frontend/src/styles/tokens.css` as CSS custom properties and are reused by every component.
- Vite proxies API paths under `/repositories/.../commits/...` (plural) and `/health` to `localhost:5000`. Page routes use singular `/commit/` and are **not** proxied — they fall back to `index.html` so hard refresh / direct paste works. Express can optionally serve `frontend/dist` the same way (API routes registered before the SPA catch-all).

## Key decisions

1. **One GitHub call serves both endpoints.** `GET /repos/.../commits/{sha}` already includes `files[].patch`. Both API handlers share `fetchCommitRaw`, which is memoized in an in-memory cache keyed by `owner/repo/oid`. Commit content is immutable, so there is no TTL.
2. **Unified-diff parsing is custom.** GitHub’s `patch` is walked line-by-line: hunk headers reset base/head counters; ` ` increments both; `-` increments base only; `+` increments head only. Missing patches (binary / oversized files) become `hunks: []` instead of throwing.
3. **Status mapping** follows the brief: `added→ADDED`, `removed→DELETED`, `modified→MODIFIED`, `renamed→RENAMED`, `copied→COPIED`, `changed→TYPE_CHANGED`.
4. **Avatar fallback.** Prefer `author.avatar_url` / `committer.avatar_url` from GitHub; otherwise generate a Gravatar identicon from the git email.
5. **Committer line is conditional.** Shown only when name/email or calendar day differs from the author (matches the Figma annotation).
6. **File blocks start expanded for the first file only** so the page matches the mixed expanded/collapsed mock without overwhelming large commits.

## Deviations / limitations

- GitHub truncates the `files` array on very large commits (API returns at most ~300 files and may omit patches). Those files appear with empty hunks.
- Relative times use a small word map (`four days ago`) for small counts; larger counts fall back to numerals.
- In-memory cache is per-process and lost on restart; fine for a local demo, not for multi-instance production.
- Merge commits show every parent oid; navigating parents is display-only (not linked to other routes in this MVP).
- The swagger example under `Commit` uses a `message` field, but the schema’s required properties are `subject` + `body`. The implementation follows the schema (and the brief), not the example.

## Error handling

| Condition                | Status | Notes                                          |
| ------------------------ | ------ | ---------------------------------------------- |
| SHA not `^[0-9a-f]{40}$` | 400    | Validated before any GitHub call               |
| Repo or commit missing   | 404    | Propagated from GitHub 404                     |
| Rate limit / network     | 503    | Clear message; suggests setting `GITHUB_TOKEN` |
| Other GitHub failures    | 502    | Surfaces GitHub’s message when available       |

## Future work

- Persist cache (Redis) and add ETag / conditional requests.
- Link commit/parent SHAs to in-app routes.
- Syntax highlighting and word-level diff for modified lines.
- GraphQL `commit` + `fileDiffs` for richer rename/copy metadata when REST truncates.
- Automated contract tests against `swagger.json` and golden-file tests for the patch parser.
