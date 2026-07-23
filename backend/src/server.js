const createApp = require('./app');
const config = require('./config/env');

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `[fatal] Port ${config.port} is already in use. Stop the other process or set PORT.`,
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
