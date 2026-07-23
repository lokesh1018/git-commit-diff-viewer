# Backend — Git Commit Diff API

Express server that implements the swagger contract and fetches commit data from the GitHub REST API.

## Setup

```bash
cd backend
cp .env.example .env   # if needed — GITHUB_TOKEN should already be in .env
npm install
npm run dev            # or: npm start
```

Server listens on **http://localhost:5000**.

If you see `EADDRINUSE` / port already in use:

```bash
npm run free-port
npm run dev
```

## Endpoints

- `GET /repositories/:owner/:repository/commits/:oid`
- `GET /repositories/:owner/:repository/commits/:oid/diff`
- `GET /health`

`oid` must match `^[0-9a-f]{40}$`.
