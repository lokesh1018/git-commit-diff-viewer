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

  // Needed when the browser calls :5000 directly (e.g. VITE_API_BASE).
  // With the Vite proxy, the browser stays on :1234 so CORS is unused.
  app.use(
    cors({
      origin: config.frontendOrigin,
    }),
  );
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Register API before any SPA catch-all so /commits/* always hits Express.
  app.use('/repositories', commitRoutes);

  // Optional: serve frontend/dist from Express (single-origin production).
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));

    app.get('*', (req, res, next) => {
      // Plural /commits/ = API → JSON 404. Singular /commit/ = SPA page.
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
