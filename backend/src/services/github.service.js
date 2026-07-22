const crypto = require('crypto');
const config = require('../config/env');
const cache = require('../utils/cache');
const { createError } = require('../middleware/errorHandler');
const { mapFileDifference } = require('./diffParser.service');

const OID_PATTERN = /^[0-9a-f]{40}$/;

function validateOid(oid) {
  if (!OID_PATTERN.test(oid)) {
    throw createError(
      400,
      `Invalid commit SHA: expected a 40-character hexadecimal string, got "${oid}"`,
      'INVALID_OID',
    );
  }
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
  // Body is the rest with no leading newline (strip blank line after subject)
  let body = raw.slice(newlineIndex + 1);
  body = body.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/^\n+/, '');
  return { subject, body };
}

async function githubFetch(pathname) {
  console.log(`Fetching from GitHub API: ${pathname}`);
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'git-commit-diff-viewer',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (config.githubToken) {
    headers.Authorization = `Bearer ${config.githubToken}`;
  }

  let response;
  try {
    response = await fetch(`${config.githubApiBase}${pathname}`, { headers });
  } catch (networkErr) {
    throw createError(
      503,
      `Unable to reach GitHub API: ${networkErr.message}`,
      'GITHUB_UNAVAILABLE',
    );
  }

  if (response.status === 404 || response.status === 422) {
    // GitHub returns 422 when the SHA is well-formed but no commit exists
    throw createError(404, 'Repository or commit not found', 'NOT_FOUND');
  }

  if (response.status === 403 || response.status === 429) {
    const rateLimited =
      response.headers.get('x-ratelimit-remaining') === '0' ||
      response.status === 429;
    const message = rateLimited
      ? 'GitHub API rate limit exceeded. Please try again later or provide a GITHUB_TOKEN.'
      : 'GitHub API refused the request (403). Check token permissions.';
    throw createError(rateLimited ? 503 : 502, message, 'GITHUB_RATE_LIMIT');
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

  return response.json();
}

async function fetchCommitRaw(owner, repository, oid) {
  validateOid(oid);
  const cacheKey = `commit:${owner}/${repository}/${oid}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const data = await githubFetch(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/commits/${oid}`,
  );

  cache.set(cacheKey, data);
  return data;
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
    parents: (data.parents || []).map((p) => ({ oid: p.sha })),
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
  const files = data.files || [];
  return files.map(mapFileDifference);
}

module.exports = {
  validateOid,
  getCommit,
  getCommitDiff,
  splitMessage,
  gravatarUrl,
};
