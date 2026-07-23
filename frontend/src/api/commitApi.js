// Empty = same-origin (Vite proxies /repositories/.../commits/ to Express in dev).
const API_BASE = import.meta.env.VITE_API_BASE || '';

// Case-insensitive precheck; backend still normalizes oid to lowercase.
const OID_PATTERN = /^[0-9a-f]{40}$/i;

export function isValidCommitSha(sha) {
  return typeof sha === 'string' && OID_PATTERN.test(sha.trim());
}

async function request(path) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`);
  } catch {
    // fetch() itself failed (backend down / network) — not an HTTP error status
    const error = new Error(
      'Unable to reach the API server. Is the backend running on port 5050?',
    );
    error.status = 0;
    error.code = 'NETWORK_ERROR';
    throw error;
  }

  let payload = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const error = new Error(
      payload?.message || `Request failed with status ${response.status}`,
    );
    error.status = response.status;
    error.code = payload?.error || 'REQUEST_FAILED';
    throw error;
  }

  if (payload === null) {
    const error = new Error('API returned a non-JSON response');
    error.status = 502;
    error.code = 'INVALID_RESPONSE';
    throw error;
  }

  return payload;
}

/** API uses plural `/commits/` (page route is singular `/commit/`). */
export function fetchCommit(owner, repository, oid) {
  return request(
    `/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/commits/${oid}`,
  );
}

export function fetchCommitDiff(owner, repository, oid) {
  return request(
    `/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/commits/${oid}/diff`,
  );
}
