# Git Commit Diff Viewer

Full-stack app that shows GitHub commit metadata and a file-by-file unified diff, matching the provided API contract (`swagger.json`) and Figma design tokens.

## Prerequisites

- Node.js 18+ (uses native `fetch`)
- A GitHub personal access token with `public_repo` (or `repo` for private repos)

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env   # skip if .env already exists
# Edit .env and set GITHUB_TOKEN=...
npm install
npm run dev
```

Backend listens on **http://localhost:5000**.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend listens on **http://localhost:1234** and proxies API calls to the backend.

## Try it

Open:

```
http://localhost:1234/repositories/golemfactory/clay/commit/a1bf367b3af680b1182cc52bb77ba095764a11f9
```

Or any other public commit:

```
http://localhost:1234/repositories/{owner}/{repository}/commit/{40-char-sha}
```

## API

| Method | Path                                                    | Description                             |
| ------ | ------------------------------------------------------- | --------------------------------------- |
| GET    | `/repositories/{owner}/{repository}/commits/{oid}`      | Commit metadata (array of one `Commit`) |
| GET    | `/repositories/{owner}/{repository}/commits/{oid}/diff` | File diffs (`CombinedFileDifference[]`) |
| GET    | `/health`                                               | Liveness check                          |

`oid` must match `^[0-9a-f]{40}$`.

See `swagger.json` for the full schema and `SOLUTION.md` for architecture notes.
