const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const githubService = require('../src/services/github.service');
const {
  OID_A,
  OID_PARENT,
  mockJsonResponse,
  sampleCommitPayload,
} = require('./helpers/githubFixtures');

describe('github.service', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    githubService.resetForTests();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    githubService.resetForTests();
  });

  it('getCommit maps GitHub payload to swagger Commit[]', async () => {
    global.fetch = async () =>
      mockJsonResponse(200, sampleCommitPayload());

    const result = await githubService.getCommit('golemfactory', 'clay', OID_A);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0], {
      oid: OID_A,
      subject: 'Fix clay parser',
      body: 'Handle empty hunks.',
      parents: [{ oid: OID_PARENT }],
      author: {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        date: '2024-01-15T12:00:00Z',
        avatarUrl: 'https://avatars.example/ada.png',
      },
      committer: {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        date: '2024-01-15T12:00:00Z',
        avatarUrl: 'https://avatars.example/ada.png',
      },
    });
  });

  it('getCommitDiff maps files into CombinedFileDifference[]', async () => {
    global.fetch = async () =>
      mockJsonResponse(200, sampleCommitPayload());

    const diffs = await githubService.getCommitDiff(
      'golemfactory',
      'clay',
      OID_A,
    );
    assert.equal(diffs.length, 2);
    assert.equal(diffs[0].changeKind, 'MODIFIED');
    assert.deepEqual(diffs[0].headFile, { path: 'src/main.rs' });
    assert.equal(diffs[0].hunks.length, 1);
    assert.equal(diffs[1].changeKind, 'ADDED');
    assert.equal(diffs[1].baseFile, null);
  });

  it('caches commit payload and only fetches once', async () => {
    let calls = 0;
    global.fetch = async () => {
      calls += 1;
      return mockJsonResponse(200, sampleCommitPayload());
    };

    await githubService.getCommit('golemfactory', 'clay', OID_A);
    await githubService.getCommitDiff('golemfactory', 'clay', OID_A);
    assert.equal(calls, 1);
  });

  it('coalesces parallel in-flight requests for the same commit', async () => {
    let calls = 0;
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });

    global.fetch = async () => {
      calls += 1;
      await gate;
      return mockJsonResponse(200, sampleCommitPayload());
    };

    const p1 = githubService.getCommit('golemfactory', 'clay', OID_A);
    const p2 = githubService.getCommitDiff('golemfactory', 'clay', OID_A);
    release();
    await Promise.all([p1, p2]);
    assert.equal(calls, 1);
  });

  it('maps 404 to NOT_FOUND', async () => {
    global.fetch = async () => mockJsonResponse(404, { message: 'Not Found' });

    await assert.rejects(
      () => githubService.getCommit('golemfactory', 'clay', OID_A),
      (err) => {
        assert.equal(err.status, 404);
        assert.equal(err.code, 'NOT_FOUND');
        return true;
      },
    );
  });

  it('maps 422 to NOT_FOUND', async () => {
    global.fetch = async () =>
      mockJsonResponse(422, { message: 'Validation Failed' });

    await assert.rejects(
      () => githubService.getCommit('golemfactory', 'clay', OID_A),
      (err) => err.status === 404 && err.code === 'NOT_FOUND',
    );
  });

  it('maps 429 to GITHUB_RATE_LIMIT', async () => {
    global.fetch = async () =>
      mockJsonResponse(429, { message: 'API rate limit exceeded' });

    await assert.rejects(
      () => githubService.getCommit('golemfactory', 'clay', OID_A),
      (err) => err.status === 503 && err.code === 'GITHUB_RATE_LIMIT',
    );
  });

  it('maps 403 with exhausted rate limit to GITHUB_RATE_LIMIT', async () => {
    global.fetch = async () =>
      mockJsonResponse(
        403,
        { message: 'API rate limit exceeded' },
        { 'x-ratelimit-remaining': '0' },
      );

    await assert.rejects(
      () => githubService.getCommit('golemfactory', 'clay', OID_A),
      (err) => err.status === 503 && err.code === 'GITHUB_RATE_LIMIT',
    );
  });

  it('maps 403 without rate-limit header to GITHUB_FORBIDDEN', async () => {
    global.fetch = async () =>
      mockJsonResponse(403, { message: 'Forbidden' }, {
        'x-ratelimit-remaining': '10',
      });

    await assert.rejects(
      () => githubService.getCommit('golemfactory', 'clay', OID_A),
      (err) => err.status === 502 && err.code === 'GITHUB_FORBIDDEN',
    );
  });

  it('maps other GitHub errors to GITHUB_ERROR', async () => {
    global.fetch = async () =>
      mockJsonResponse(500, { message: 'Server Error' });

    await assert.rejects(
      () => githubService.getCommit('golemfactory', 'clay', OID_A),
      (err) => err.status === 502 && err.code === 'GITHUB_ERROR',
    );
  });

  it('maps network failures to GITHUB_UNAVAILABLE', async () => {
    global.fetch = async () => {
      throw new Error('ECONNREFUSED');
    };

    await assert.rejects(
      () => githubService.getCommit('golemfactory', 'clay', OID_A),
      (err) => err.status === 503 && err.code === 'GITHUB_UNAVAILABLE',
    );
  });

  it('maps abort/timeout to GITHUB_TIMEOUT', async () => {
    global.fetch = async () => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      throw err;
    };

    await assert.rejects(
      () => githubService.getCommit('golemfactory', 'clay', OID_A),
      (err) => err.status === 503 && err.code === 'GITHUB_TIMEOUT',
    );
  });

  it('rejects unexpected commit payloads', async () => {
    global.fetch = async () => mockJsonResponse(200, { message: 'no sha' });

    await assert.rejects(
      () => githubService.getCommit('golemfactory', 'clay', OID_A),
      (err) => err.status === 502 && err.code === 'GITHUB_INVALID_RESPONSE',
    );
  });

  it('uses gravatar when GitHub user avatar is missing', async () => {
    global.fetch = async () =>
      mockJsonResponse(
        200,
        sampleCommitPayload({
          author: null,
          committer: null,
        }),
      );

    const [commit] = await githubService.getCommit(
      'golemfactory',
      'clay',
      OID_A,
    );
    assert.match(commit.author.avatarUrl, /gravatar\.com\/avatar\//);
  });
});
