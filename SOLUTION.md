# Solution Notes

Architecture decisions, limitations, and planned follow-ups for this project.

---

## 1. Approach — architecture and technology choices

### What we built

A full-stack commit viewer:

- **Frontend (React + Vite)** on `http://localhost:1234` with a single route  
  `/repositories/:owner/:repository/commit/:commitSHA`
- **Backend (Node.js + Express)** on `http://localhost:5050` implementing the API described in `swagger.json`
- Data is fetched from the **GitHub REST API** and reshaped to those schemas

```
Browser (Vite :1234)
  └─ React route …/commit/:commitSHA
       ├─ GET …/commits/:oid        ──proxy──▶ Express (:5050)
       └─ GET …/commits/:oid/diff   ──proxy──▶ Express (:5050)
                                              └─ GitHub REST
                                                   GET /repos/{owner}/{repo}/commits/{ref}
```

### Why these technologies

| Choice                                 | Why                                                                                                |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Express + native `fetch`               | Minimal surface area, Node 18+ has fetch built-in, easy to map the API routes                      |
| GitHub **REST** (not GraphQL)          | One commit endpoint already returns metadata + `files[].patch` for the common case                 |
| Vite proxy                             | Keeps `GITHUB_TOKEN` server-side only; browser never talks to GitHub                               |
| CSS custom properties                  | Shared tokens in `frontend/src/styles/tokens.css`, reused for typography, color, and spacing       |
| In-memory cache + in-flight coalescing | Commits are immutable; avoids duplicate GitHub calls when the UI loads metadata + diff in parallel |

### Key implementation decisions

1. **One GitHub call powers both backend routes.** Shared `fetchCommitRaw` is cached by `owner/repo/oid` and coalesces concurrent requests.
2. **Custom unified-diff parser.** Walks `@@` hunk headers and `+` / `-` / ` ` lines to compute `baseLineNumber` / `headLineNumber`. Missing patches (binary / large files) → `hunks: []`.
3. **Status mapping:** `added→ADDED`, `removed→DELETED`, `modified→MODIFIED`, `renamed→RENAMED`, `copied→COPIED`, `changed→TYPE_CHANGED`.
4. **Avatars:** GitHub `avatar_url` when present; otherwise Gravatar identicon from email; frontend also falls back if the image fails to load.
5. **Committer UI:**
   - “Commited by …” only when name **or** date differs from the author
   - Relative time on that line only when the **date** differs from the author date
6. **Parent SHA styling:** Link-monospace + link color (`#1C7CD6`), underline on hover; **no navigation** (display-only for the single-page MVP).
7. **SPA routing:** Frontend page uses singular `/commit/`; API uses plural `/commits/`. Vite proxies only API paths so hard-refresh / pasted URLs work.
8. **Validation & errors:** Owner/repo/oid validated before GitHub; centralized Express error middleware returns 400 / 404 / 502 / 503 with clear codes.
9. **Automated tests:** Backend uses Node’s built-in test runner (parser, validation, GitHub error mapping with mocked `fetch`, HTTP success/error). Frontend uses Vitest (`commitApi`, `useCommit`, date helpers).

### Schema notes

- Commit payloads use `subject` + `body` (not a single `message` field), matching `swagger.json`.
- Parent objects require `oid`.
- In addition to `200` responses, the API returns structured 400 / 404 / 502 / 503 errors for a usable UI.

---

## 2. Known limitations and trade-offs

| Limitation                                                                                   | Trade-off / why accepted                                                |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| GitHub truncates large commits (~300 files) and may omit `patch` for big/binary files        | Empty `hunks: []` is safer than failing the whole page                  |
| In-memory cache is per-process (lost on restart, not shared across instances)                | Enough for local development; Redis would be overkill for the MVP       |
| No syntax highlighting / word-level diffs                                                    | Monospace + added/removed/context coloring matches the current UI scope |
| Parent SHAs look like links (hover underline) but do not navigate                            | Single-page MVP; navigation listed under future work                    |
| Relative times use word forms for small counts (`four days ago`) and numerals for large ones | Readable copy without a heavy i18n library                              |
| Rate limits depend on `GITHUB_TOKEN`                                                         | Documented in README; without a token GitHub allows only 60 req/hr      |

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
**Why:** Improves readability for large code reviews.

### GraphQL fallback for truncated REST commits

**What:** When REST omits files/patches, fetch via GitHub GraphQL `commit.file` connections.  
**How:** Detect truncated responses; page GraphQL diffs.  
**Why:** Completeness for very large commits without abandoning REST for the common case.

### OpenAPI checks + golden patch fixtures

**What:** Assert mapped responses against `swagger.json`; store real GitHub patches as golden files for line-number regressions.  
**How:** OpenAPI response validator in the backend suite; fixtures under `backend/test/fixtures/`.  
**Why:** Unit tests already cover parser/validation/GitHub mapping; contract + golden files would catch schema drift and exotic patches.  
**Status:** Core unit/integration tests are in place (`npm test`); OpenAPI validation and golden fixtures are not yet.

---

## Error handling summary

| Condition                         | Status | Code                                                            |
| --------------------------------- | ------ | --------------------------------------------------------------- |
| Invalid owner / repository / SHA  | 400    | `INVALID_OWNER` / `INVALID_REPOSITORY` / `INVALID_OID`          |
| Repo or commit not found          | 404    | `NOT_FOUND`                                                     |
| GitHub rate limit                 | 503    | `GITHUB_RATE_LIMIT`                                             |
| GitHub timeout / network down     | 503    | `GITHUB_TIMEOUT` / `GITHUB_UNAVAILABLE`                         |
| Other GitHub / bad payload errors | 502    | `GITHUB_ERROR` / `GITHUB_FORBIDDEN` / `GITHUB_INVALID_RESPONSE` |
