# Solution Notes

This document answers the three review questions from the coding exercise brief.

---

## 1. Approach — architecture, technology choices, intentional deviations

### What we built

A full-stack commit viewer:

- **Frontend (React + Vite)** on `http://localhost:1234` with a single route  
  `/repositories/:owner/:repository/commit/:commitSHA`
- **Backend (Node.js + Express)** on `http://localhost:5000` implementing the published API contract  
  ([FS Dev Git-Diff API](https://teamfleetstudio.github.io/git-diff-api-doc/) / local `swagger.json`)
- Data is fetched from the **GitHub REST API** and reshaped to the swagger schemas

```
Browser (Vite :1234)
  └─ React route …/commit/:commitSHA
       ├─ GET …/commits/:oid        ──proxy──▶ Express (:5000)
       └─ GET …/commits/:oid/diff   ──proxy──▶ Express (:5000)
                                              └─ GitHub REST
                                                   GET /repos/{owner}/{repo}/commits/{ref}
```

### Why these technologies

| Choice                                 | Why                                                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Express + native `fetch`               | Minimal surface area, Node 18+ has fetch built-in, easy to map swagger routes                                      |
| GitHub **REST** (not GraphQL)          | One commit endpoint already returns metadata + `files[].patch`; enough for the contract without GraphQL complexity |
| Vite proxy                             | Keeps `GITHUB_TOKEN` server-side only; browser never talks to GitHub                                               |
| CSS custom properties                  | Figma tokens applied once in `tokens.css`, reused everywhere for pixel consistency                                 |
| In-memory cache + in-flight coalescing | Commits are immutable; avoids duplicate GitHub calls when the UI loads metadata + diff in parallel                 |

### Key implementation decisions

1. **One GitHub call powers both backend routes.** Shared `fetchCommitRaw` is cached by `owner/repo/oid` and coalesces concurrent requests.
2. **Custom unified-diff parser.** Walks `@@` hunk headers and `+` / `-` / ` ` lines to compute `baseLineNumber` / `headLineNumber`. Missing patches (binary / large files) → `hunks: []`.
3. **Status mapping:** `added→ADDED`, `removed→DELETED`, `modified→MODIFIED`, `renamed→RENAMED`, `copied→COPIED`, `changed→TYPE_CHANGED`.
4. **Avatars:** GitHub `avatar_url` when present; otherwise Gravatar identicon from email; frontend also falls back if the image fails to load.
5. **Committer UI (Figma):**
   - “Commited by …” only when name **or** date differs from the author
   - Relative time on that line only when the **date** differs from the author date
6. **Parent SHA styling:** Link-monospace + link color (`#1C7CD6`), underline on hover; **no navigation** (display-only per single-page scope).
7. **SPA routing:** Frontend page uses singular `/commit/`; API uses plural `/commits/`. Vite proxies only API paths so hard-refresh / pasted URLs work.
8. **Validation & errors:** Owner/repo/oid validated before GitHub; centralized Express error middleware returns 400 / 404 / 502 / 503 with clear codes.

### Intentional deviations from upstream docs

- Upstream published **example** historically showed a `message` field; the **schema** (and this app) use `subject` + `body`. Local `swagger.json` example was corrected to match the schema.
- Upstream swagger `parents.items.required` incorrectly listed `"parents"`; local `swagger.json` requires `"oid"`.
- Upstream OpenAPI only documents `200` responses; we also return (and document) structured 400/404/502/503 errors for a usable UI.

---

## 2. Known limitations and trade-offs

| Limitation                                                                                   | Trade-off / why accepted                                                              |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| GitHub truncates large commits (~300 files) and may omit `patch` for big/binary files        | REST is what the brief allows; empty `hunks: []` is safer than failing the whole page |
| In-memory cache is per-process (lost on restart, not shared across instances)                | Enough for a local coding exercise; Redis would be overkill for the MVP               |
| No syntax highlighting / word-level diffs                                                    | Out of Figma scope; monospace + line coloring matches the design                      |
| Parent SHAs look like links (hover underline) but do not navigate                            | Single-page MVP; navigation listed under future work                                  |
| Relative times use word forms for small counts (`four days ago`) and numerals for large ones | Close to Figma copy without a heavy i18n library                                      |
| Rate limits depend on `GITHUB_TOKEN`                                                         | Documented in README; without a token GitHub allows only 60 req/hr                    |

---

## 3. Future work — what, how, and why

### Persist cache (Redis) + conditional requests

**What:** Shared cache across processes with ETag / `If-None-Match` to GitHub.  
**How:** Redis keyed by `owner/repo/oid`; store GitHub `ETag` alongside payload.  
**Why:** Survives restarts, works with multiple backend instances, cuts GitHub quota usage.

### Link parent (and commit) SHAs in the UI

**What:** Turn the styled Parent SHA into a real route to `/repositories/.../commit/:sha` (optional for Commit SHA too).  
**How:** `react-router` `<Link>` on the right-hand meta (hover underline already matches link affordance).  
**Why:** Natural history exploration without leaving the app.

### Richer diffs (syntax highlight + word diff)

**What:** Highlight language by extension; highlight changed tokens within a line.  
**How:** `highlight.js` / Shiki for syntax; Myers or similar for word-level hunks.  
**Why:** Improves readability for large code reviews beyond the Figma MVP.

### GraphQL fallback for truncated REST commits

**What:** When REST omits files/patches, fetch via GitHub GraphQL `commit.file` connections.  
**How:** Detect truncated responses; page GraphQL diffs.  
**Why:** Completeness for very large commits without abandoning REST for the common case.

### Contract + parser tests

**What:** Automated checks that responses match `swagger.json`; golden files for patch parsing.  
**How:** Vitest/Jest + OpenAPI validator; fixtures from real GitHub patches.  
**Why:** Prevents schema drift and line-number regressions.

---

## Error handling summary

| Condition                         | Status | Code                                                   |
| --------------------------------- | ------ | ------------------------------------------------------ |
| Invalid owner / repository / SHA  | 400    | `INVALID_OWNER` / `INVALID_REPOSITORY` / `INVALID_OID` |
| Repo or commit not found          | 404    | `NOT_FOUND`                                            |
| GitHub rate limit                 | 503    | `GITHUB_RATE_LIMIT`                                    |
| GitHub timeout / network down     | 503    | `GITHUB_TIMEOUT` / `GITHUB_UNAVAILABLE`                |
| Other GitHub / bad payload errors | 502    | `GITHUB_ERROR` / `GITHUB_FORBIDDEN` / …                |
