const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: Number(process.env.PORT) || 5000,
  githubToken: process.env.GITHUB_TOKEN || '',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:1234',
  githubApiBase: 'https://api.github.com',
};

if (!config.githubToken) {
  console.warn(
    '[config] GITHUB_TOKEN is not set. GitHub API rate limits will be very low (60 req/hr).',
  );
}

module.exports = config;
