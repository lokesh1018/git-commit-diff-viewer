import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Proxy only API paths (plural `/commits/`) to the Express backend.
 * Frontend page routes use singular `/commit/` and must be served as the SPA
 * (index.html) so hard refresh / direct URL paste works.
 */
function repositoriesProxy() {
  return {
    target: 'http://localhost:5000',
    changeOrigin: true,
    bypass(req) {
      const url = req.url || '';
      // SPA route: /repositories/:owner/:repo/commit/:sha
      // API route:  /repositories/:owner/:repo/commits/:oid[/diff]
      if (url.includes('/commit/') && !url.includes('/commits/')) {
        return '/index.html';
      }
      return undefined;
    },
  };
}

export default defineConfig({
  plugins: [react()],
  appType: 'spa',
  server: {
    port: 1234,
    strictPort: true,
    proxy: {
      '/repositories': repositoriesProxy(),
      '/health': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 1234,
    strictPort: true,
    proxy: {
      '/repositories': repositoriesProxy(),
      '/health': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
