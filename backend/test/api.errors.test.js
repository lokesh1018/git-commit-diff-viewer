const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const createApp = require('../src/app');

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

describe('API error handling', () => {
  const app = createApp();

  it('GET /health returns ok', async () => {
    const res = await request(app, 'GET', '/health');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { status: 'ok' });
  });

  it('returns 400 for invalid commit SHA', async () => {
    const res = await request(
      app,
      'GET',
      '/repositories/golemfactory/clay/commits/not-a-valid-sha',
    );
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'INVALID_OID');
  });

  it('returns 400 for invalid owner', async () => {
    const res = await request(
      app,
      'GET',
      '/repositories/bad!!/clay/commits/a1bf367b3af680b1182cc52bb77ba095764a11f9',
    );
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'INVALID_OWNER');
  });

  it('returns 404 JSON for unmatched commit API paths', async () => {
    // Path includes /commits/ so the SPA catch-all (if dist exists) does not swallow it
    const res = await request(
      app,
      'GET',
      '/repositories/golemfactory/clay/commits/a1bf367b3af680b1182cc52bb77ba095764a11f9/extra',
    );
    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'NOT_FOUND');
  });
});
