# Git Commit Diff Viewer

Full-stack app that displays GitHub commit metadata and a file-by-file unified diff.

- Frontend on port **1234**
- Backend API on port **5000** (schema in `swagger.json`)
- Shared CSS design tokens for typography, colors, and spacing

See **`SOLUTION.md`** for architecture decisions, limitations, and future work.

---

## Prerequisites

- **Node.js 18+** (native `fetch`)
- A GitHub personal access token (`public_repo`, or `repo` for private repos)

---

## Quick start

### 1. Backend (port 5000)

```bash
cd backend
cp .env.example .env
# Set GITHUB_TOKEN=ghp_... (or github_pat_...) in .env
npm install
npm run dev
```

Server: **<http://localhost:5000>**

### 2. Frontend (port 1234)

```bash
cd frontend
npm install
npm run dev
```

App: **<http://localhost:1234>**

Vite proxies `/repositories/.../commits/...` (API) to the backend. Page routes use singular `/commit/` and are served by the SPA.

---

## Troubleshooting

### `Port 5000 is already in use` / `EADDRINUSE`

Usually a leftover backend from an earlier terminal (or IDE) is still running. **Keep using port 5000** — do not switch ports unless you also change the Vite proxy.

```bash
cd backend
npm run free-port
npm run dev
```

Or stop the other backend with **Ctrl+C** in that terminal.

---

## Try it

```
http://localhost:1234/repositories/golemfactory/clay/commit/a1bf367b3af680b1182cc52bb77ba095764a11f9
```

Any public commit:

```
http://localhost:1234/repositories/{owner}/{repository}/commit/{40-char-sha}
```

---

## API

Base URL: `http://localhost:5000/`

| Method | Path                                                    | Response                           |
| ------ | ------------------------------------------------------- | ---------------------------------- |
| GET    | `/repositories/{owner}/{repository}/commits/{oid}`      | `Commit[]` (array with one commit) |
| GET    | `/repositories/{owner}/{repository}/commits/{oid}/diff` | `CombinedFileDifference[]`         |
| GET    | `/health`                                               | `{ "status": "ok" }`               |

- `oid` must match `^[0-9a-f]{40}$` (case-insensitive; normalized to lowercase)
- Error responses use JSON `{ "error": "<CODE>", "message": "..." }` with status **400** / **404** / **502** / **503**

Full schema: `swagger.json`

---

## Tests

```bash
# from repo root — runs backend + frontend suites
npm test

# or individually
npm run test:backend   # Node.js built-in test runner
npm run test:frontend  # Vitest
```

Coverage includes diff parsing, request validation, commit-message splitting, GitHub error mapping (mocked), API success/error responses, `useCommit` loading states, and frontend date/SHA helpers.

---

## Project layout

```
backend/     Express API + GitHub integration (+ test/)
frontend/    React (Vite) commit page (+ Vitest under src/)
swagger.json OpenAPI schema
SOLUTION.md  Design decisions & trade-offs
README.md    This file
package.json Root helpers: npm pack + npm test
```

---

## Packaging

### Option A — public git URL

Push this repo and share the URL. Recipients run the steps under **Quick start**.

### Option B — `npm pack`

From the **repository root**:

```bash
npm pack
```

This uses the root `package.json` `files` whitelist so `node_modules`, `.env`, and build artifacts are excluded. Send the resulting `.tgz` archive.

To unpack and run:

```bash
mkdir review && tar -xzf git-commit-diff-viewer-1.0.0.tgz -C review --strip-components=1
cd review/backend && cp .env.example .env   # add GITHUB_TOKEN
npm install && npm run dev
# new terminal
cd review/frontend && npm install && npm run dev
```

---

## Environment

| Variable          | Where          | Purpose                                                                  |
| ----------------- | -------------- | ------------------------------------------------------------------------ |
| `GITHUB_TOKEN`    | `backend/.env` | Raises GitHub rate limit (required for practical use; never on frontend) |
| `PORT`            | `backend/.env` | Backend port (default `5000`)                                            |
| `FRONTEND_ORIGIN` | `backend/.env` | CORS allowlist when browser calls `:5000` directly (default `:1234`)     |

Optional / not needed for local `npm run dev`:

| Variable        | Where            | Purpose                                                               |
| --------------- | ---------------- | --------------------------------------------------------------------- |
| `VITE_API_BASE` | frontend `.env*` | Absolute API origin. Leave unset so Vite proxies relative `/commits/` |
