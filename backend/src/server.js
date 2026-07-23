const createApp = require('./app');
const config = require('./config/env');

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      [
        `[fatal] Port ${config.port} is already in use.`,
        'A previous backend (or another app) is still running.',
        '',
        'Fix (recommended):',
        '  cd backend',
        '  npm run free-port',
        '  npm run dev',
        '',
        'Or stop the other terminal where the backend is running (Ctrl+C).',
        'Do not change PORT unless you also update frontend/vite.config.js proxy targets.',
      ].join('\n'),
    );
  } else {
    console.error('[fatal] Server failed to start:', err.message);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
  process.exit(1);
});
