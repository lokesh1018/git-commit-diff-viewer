import './NotFound.css';

export default function NotFound() {
  return (
    <div className="not-found" role="status">
      <h1 className="not-found__title">Page not found</h1>
      <p className="not-found__detail">
        This URL does not match a known route. Use{' '}
        <code className="not-found__code">
          /repositories/:owner/:repository/commit/:commitSHA
        </code>
        .
      </p>
    </div>
  );
}
