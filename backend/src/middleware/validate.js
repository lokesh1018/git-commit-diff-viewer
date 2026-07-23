const { createError } = require('./errorHandler');

// Lowercase-only; validateOidParam lowercases before testing.
const OID_PATTERN = /^[0-9a-f]{40}$/;
// GitHub owner/repo: alphanumeric, hyphens; repo may include dots/underscores
const OWNER_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
const REPO_PATTERN = /^[a-zA-Z0-9._-]{1,100}$/;

function validateOidParam(req, res, next) {
  const raw = req.params.oid;
  if (typeof raw !== 'string' || !raw.trim()) {
    return next(
      createError(
        400,
        'Invalid commit SHA: expected a 40-character hexadecimal string',
        'INVALID_OID',
      ),
    );
  }

  const oid = raw.trim().toLowerCase();
  if (!OID_PATTERN.test(oid)) {
    return next(
      createError(
        400,
        `Invalid commit SHA: expected a 40-character hexadecimal string, got "${raw}"`,
        'INVALID_OID',
      ),
    );
  }

  // Normalize so controllers/cache always see lowercase oid.
  req.params.oid = oid;
  return next();
}

function validateRepoParams(req, res, next) {
  const { owner, repository } = req.params;

  if (typeof owner !== 'string' || !owner.trim()) {
    return next(
      createError(400, 'Invalid owner: must be a non-empty string', 'INVALID_OWNER'),
    );
  }

  if (typeof repository !== 'string' || !repository.trim()) {
    return next(
      createError(
        400,
        'Invalid repository: must be a non-empty string',
        'INVALID_REPOSITORY',
      ),
    );
  }

  const trimmedOwner = owner.trim();
  const trimmedRepo = repository.trim();

  if (!OWNER_PATTERN.test(trimmedOwner)) {
    return next(
      createError(
        400,
        `Invalid owner name: "${trimmedOwner}"`,
        'INVALID_OWNER',
      ),
    );
  }

  if (!REPO_PATTERN.test(trimmedRepo)) {
    return next(
      createError(
        400,
        `Invalid repository name: "${trimmedRepo}"`,
        'INVALID_REPOSITORY',
      ),
    );
  }

  req.params.owner = trimmedOwner;
  req.params.repository = trimmedRepo;
  return next();
}

module.exports = {
  validateOidParam,
  validateRepoParams,
  OID_PATTERN,
  OWNER_PATTERN,
  REPO_PATTERN,
};
