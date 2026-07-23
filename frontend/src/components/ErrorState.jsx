import './ErrorState.css';

export default function ErrorState({ error }) {
  const status = error?.status;
  const code = error?.code;
  let title = 'Something went wrong';
  let detail = error?.message || 'An unexpected error occurred.';

  if (status === 400 || code === 'INVALID_OID' || code === 'INVALID_OWNER') {
    title = 'Invalid request';
  } else if (status === 404 || code === 'NOT_FOUND') {
    title = 'Commit not found';
  } else if (code === 'GITHUB_RATE_LIMIT') {
    title = 'GitHub rate limit exceeded';
  } else if (status === 502 || status === 503 || code === 'GITHUB_TIMEOUT') {
    title = 'GitHub unavailable';
  } else if (status === 0 || code === 'NETWORK_ERROR') {
    title = 'Backend unreachable';
  }

  return (
    <div className="error-state" role="alert">
      <h1 className="error-state__title">{title}</h1>
      <p className="error-state__detail">{detail}</p>
    </div>
  );
}
