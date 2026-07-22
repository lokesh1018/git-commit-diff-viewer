# Frontend — Git Commit Diff Viewer

React + Vite UI that renders a commit header and file-by-file diffs, matching the Figma design tokens.

## Setup

```bash
cd frontend
npm install
npm run dev
```

App runs on **http://localhost:1234** and proxies `/repositories/*` to the backend on port 5000.

## Route

```
/repositories/:owner/:repository/commit/:commitSHA
```

Example:

```
http://localhost:1234/repositories/golemfactory/clay/commit/a1bf367b3af680b1182cc52bb77ba095764a11f9
```
