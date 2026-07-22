import './Loader.css';

export default function Loader() {
  return (
    <div className="loader" role="status" aria-live="polite">
      <div className="loader__spinner" aria-hidden="true" />
      <p className="loader__text">Loading commit…</p>
    </div>
  );
}
