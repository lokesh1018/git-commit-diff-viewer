const crypto = require('crypto');
const config = require('../config/env');
const cache = require('../utils/cache');
const { createError } = require('../middleware/errorHandler');
const { mapFileDifference } = require('./diffParser.service');
const { OID_PATTERN } = require('../middleware/validate');

const FETCH_TIMEOUT_MS = 15000;
/** In-flight GitHub requests keyed by cache key — coalesces parallel metadata+diff loads */
const inflight = new Map();

function validateOid(oid) {
  const normalized = String(oid || '').trim().toLowerCase();
  if (!OID_PATTERN.test(normalized)) {
    throw createError(
      400,
      `Invalid commit SHA: expected a 40-character hexadecimal string, got "${oid}"`,
      'INVALID_OID',
    );
  }
  return normalized;
}

function gravatarUrl(email) {
  const hash = crypto
    .createHash('md5')
    .update(String(email || '').trim().toLowerCase())
    .digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=80`;
}

function toSignature(gitPerson, githubUser) {
  const email = gitPerson?.email || '';
  return {
    name: gitPerson?.name || 'Unknown',
    email,
    date: gitPerson?.date || new Date().toISOString(),
    avatarUrl: githubUser?.avatar_url || gravatarUrl(email),
  };
}

function splitMessage(message) {
  const raw = message || '';
  const newlineIndex = raw.indexOf('\n');
  if (newlineIndex === -1) {
    return { subject: raw, body: '' };
  }
  const subject = raw.slice(0, newlineIndex);
  let body = raw.slice(newlineIndex + 1);
  body = body.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/^\n+/, '');
  return { subject, body };
}

async function githubFetch(pathname) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'git-commit-diff-viewer',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (config.githubToken) {
    headers.Authorization = `Bearer ${config.githubToken}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response;
  try {
    console.log(`Fetching from GitHub API: ${pathname}`);
    response = await fetch(`${config.githubApiBase}${pathname}`, {
      headers,
      signal: controller.signal,
    });
  } catch (networkErr) {
    if (networkErr.name === 'AbortError') {
      throw createError(
        503,
        `GitHub API request timed out after ${FETCH_TIMEOUT_MS / 1000}s`,
        'GITHUB_TIMEOUT',
      );
    }
    throw createError(
      503,
      `Unable to reach GitHub API: ${networkErr.message}`,
      'GITHUB_UNAVAILABLE',
    );
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 404 || response.status === 422) {
    throw createError(404, 'Repository or commit not found', 'NOT_FOUND');
  }

  if (response.status === 403 || response.status === 429) {
    const rateLimited =
      response.headers.get('x-ratelimit-remaining') === '0' ||
      response.status === 429;
    if (rateLimited) {
      throw createError(
        503,
        'GitHub API rate limit exceeded. Please try again later or provide a GITHUB_TOKEN.',
        'GITHUB_RATE_LIMIT',
      );
    }
    throw createError(
      502,
      'GitHub API refused the request (403). Check token permissions.',
      'GITHUB_FORBIDDEN',
    );
  }

  if (!response.ok) {
    let details;
    try {
      details = await response.json();
    } catch {
      details = undefined;
    }
    throw createError(
      502,
      `GitHub API error (${response.status}): ${details?.message || response.statusText}`,
      'GITHUB_ERROR',
      details,
    );
  }

  try {
    return await response.json();
  } catch {
    throw createError(
      502,
      'GitHub API returned an invalid JSON response',
      'GITHUB_INVALID_RESPONSE',
    );
  }
}

async function fetchCommitRaw(owner, repository, oid) {
  const normalizedOid = validateOid(oid);
  const cacheKey = `commit:${owner}/${repository}/${normalizedOid}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  if (inflight.has(cacheKey)) {
    return inflight.get(cacheKey);
  }

  const promise = githubFetch(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/commits/${normalizedOid}`,
  )
    .then((data) => {
      if (!data || typeof data.sha !== 'string') {
        throw createError(
          502,
          'GitHub API returned an unexpected commit payload',
          'GITHUB_INVALID_RESPONSE',
        );
      }
      cache.set(cacheKey, data);
      return data;
    })
    .finally(() => {
      inflight.delete(cacheKey);
    });

  inflight.set(cacheKey, promise);
  return promise;
}

/**
 * Returns an array with a single Commit object (per swagger contract).
 */
async function getCommit(owner, repository, oid) {
  const data = await fetchCommitRaw(owner, repository, oid);
  const { subject, body } = splitMessage(data.commit?.message);

  const commit = {
    oid: data.sha,
    subject,
    body,
    parents: (data.parents || [])
      .filter((p) => p && typeof p.sha === 'string')
      .map((p) => ({ oid: p.sha })),
    author: toSignature(data.commit?.author, data.author),
    committer: toSignature(data.commit?.committer, data.committer),
  };

  return [commit];
}

/**
 * Returns CombinedFileDifference[] for the commit.
 */
async function getCommitDiff(owner, repository, oid) {
  const data = await fetchCommitRaw(owner, repository, oid);
  const files = Array.isArray(data.files) ? data.files : [];
  return files
    .filter((file) => file && typeof file === 'object')
    .map(mapFileDifference);
}

module.exports = {
  validateOid,
  getCommit,
  getCommitDiff,
  splitMessage,
  gravatarUrl,
};
