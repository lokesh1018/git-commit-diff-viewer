const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const commitRoutes = require('./routes/commit.routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const frontendDist = path.resolve(__dirname, '../../frontend/dist');

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.frontendOrigin,
    }),
  );
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // API routes must be registered before any SPA catch-all
  app.use('/repositories', commitRoutes);

  // Optional: serve the Vite production build from Express
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));

    app.get('*', (req, res, next) => {
      // Never swallow JSON API paths — fall through to the JSON 404 handler
      if (req.path.includes('/commits/')) {
        return next();
      }
      res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
        if (err) next(err);
      });
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
