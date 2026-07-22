import './ErrorState.css';

export default function ErrorState({ error }) {
  const status = error?.status;
  let title = 'Something went wrong';
  let detail = error?.message || 'An unexpected error occurred.';

  if (status === 400) {
    title = 'Invalid commit SHA';
  } else if (status === 404) {
    title = 'Commit not found';
  } else if (status === 502 || status === 503) {
    title = 'GitHub unavailable';
  } else if (status === 0) {
    title = 'Backend unreachable';
  }

  return (
    <div className="error-state" role="alert">
      <h1 className="error-state__title">{title}</h1>
      <p className="error-state__detail">{detail}</p>
    </div>
  );
}
