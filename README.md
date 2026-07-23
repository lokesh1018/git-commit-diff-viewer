# Git Commit Diff Viewer

Full-stack app that displays GitHub commit metadata and a file-by-file unified diff.

Matches:

- Frontend route from the coding exercise (port **1234**)
- Backend API contract: [FS Dev Git-Diff API docs](https://teamfleetstudio.github.io/git-diff-api-doc/) (also mirrored in `swagger.json`)
- Figma design tokens for typography, colors, and spacing

See **`SOLUTION.md`** for architecture decisions, limitations, and future work (required by the exercise).

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

Server: **http://localhost:5000**

### 2. Frontend (port 1234)

```bash
cd frontend
npm install
npm run dev
```

App: **http://localhost:1234**

Vite proxies `/repositories/.../commits/...` (API) to the backend. Page routes use singular `/commit/` and are served by the SPA.

---

## Try it

Example from the exercise brief:

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

Full schema: `swagger.json` or https://teamfleetstudio.github.io/git-diff-api-doc/

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
backend/     Express API + GitHub integration
frontend/    React (Vite) commit page
swagger.json OpenAPI contract
SOLUTION.md  Design decisions & trade-offs
README.md    This file
```

---

## Packaging / delivery

Per the exercise, either:

### Option A — public git URL

Push this repo and share the URL. Reviewers run the steps under **Quick start**.

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

| Variable          | Where          | Purpose                                                 |
| ----------------- | -------------- | ------------------------------------------------------- |
| `GITHUB_TOKEN`    | `backend/.env` | Raises GitHub rate limit (never expose to the frontend) |
| `PORT`            | `backend/.env` | Backend port (default `5000`)                           |
| `FRONTEND_ORIGIN` | `backend/.env` | CORS origin (default `http://localhost:1234`)           |
