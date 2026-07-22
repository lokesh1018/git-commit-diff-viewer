const API_BASE = import.meta.env.VITE_API_BASE || '';

async function request(path) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`);
  } catch (err) {
    const error = new Error(
      'Unable to reach the API server. Is the backend running on port 5000?',
    );
    error.status = 0;
    throw error;
  }

  if (!response.ok) {
    let payload;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    const error = new Error(
      payload?.message || `Request failed with status ${response.status}`,
    );
    error.status = response.status;
    error.code = payload?.error;
    throw error;
  }

  return response.json();
}

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
