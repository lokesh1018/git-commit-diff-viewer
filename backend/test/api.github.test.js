const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const createApp = require('../src/app');
const githubService = require('../src/services/github.service');
const {
  OID_A,
  mockJsonResponse,
  sampleCommitPayload,
} = require('./helpers/githubFixtures');

function request(app, method, url) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      const req = http.request(
        { hostname: '127.0.0.1', port, method, path: url },
        (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            server.close();
            let json = null;
            try {
              json = JSON.parse(body);
            } catch {
              json = body;
            }
            resolve({ status: res.statusCode, body: json });
          });
        },
      );
      req.on('error', (err) => {
        server.close();
        reject(err);
      });
      req.end();
    });
  });
}

describe('API GitHub-backed routes', () => {
  const app = createApp();
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    githubService.resetForTests();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    githubService.resetForTests();
  });

  it('GET commit returns mapped Commit[]', async () => {
    global.fetch = async () =>
      mockJsonResponse(200, sampleCommitPayload());

    const res = await request(
      app,
      'GET',
      `/repositories/golemfactory/clay/commits/${OID_A}`,
    );
    assert.equal(res.status, 200);
    assert.equal(Array.isArray(res.body), true);
    assert.equal(res.body[0].oid, OID_A);
    assert.equal(res.body[0].subject, 'Fix clay parser');
    assert.equal(res.body[0].body, 'Handle empty hunks.');
  });

  it('GET commit diff returns CombinedFileDifference[]', async () => {
    global.fetch = async () =>
      mockJsonResponse(200, sampleCommitPayload());

    const res = await request(
      app,
      'GET',
      `/repositories/golemfactory/clay/commits/${OID_A}/diff`,
    );
    assert.equal(res.status, 200);
    assert.equal(Array.isArray(res.body), true);
    assert.equal(res.body.length, 2);
    assert.equal(res.body[0].changeKind, 'MODIFIED');
    assert.equal(res.body[1].changeKind, 'ADDED');
  });

  it('propagates GitHub 404 as NOT_FOUND', async () => {
    global.fetch = async () => mockJsonResponse(404, { message: 'Not Found' });

    const res = await request(
      app,
      'GET',
      `/repositories/golemfactory/clay/commits/${OID_A}`,
    );
    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'NOT_FOUND');
  });

  it('propagates rate limit as 503 GITHUB_RATE_LIMIT', async () => {
    global.fetch = async () =>
      mockJsonResponse(429, { message: 'API rate limit exceeded' });

    const res = await request(
      app,
      'GET',
      `/repositories/golemfactory/clay/commits/${OID_A}/diff`,
    );
    assert.equal(res.status, 503);
    assert.equal(res.body.error, 'GITHUB_RATE_LIMIT');
  });

  it('propagates GitHub 500 as 502 GITHUB_ERROR', async () => {
    global.fetch = async () =>
      mockJsonResponse(500, { message: 'Boom' });

    const res = await request(
      app,
      'GET',
      `/repositories/golemfactory/clay/commits/${OID_A}`,
    );
    assert.equal(res.status, 502);
    assert.equal(res.body.error, 'GITHUB_ERROR');
  });
});
