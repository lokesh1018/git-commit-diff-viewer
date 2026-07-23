# Backend — Git Commit Diff API

Express server that implements the swagger contract and fetches commit data from the GitHub REST API.

## Setup

```bash
cd backend
cp .env.example .env   # if needed — GITHUB_TOKEN should already be in .env
npm install
npm run dev            # or: npm start
```

Server listens on **<http://localhost:5050>**.

## Endpoints

- `GET /repositories/:owner/:repository/commits/:oid`
- `GET /repositories/:owner/:repository/commits/:oid/diff`
- `GET /health`

`oid` must match `^[0-9a-f]{40}$`.
