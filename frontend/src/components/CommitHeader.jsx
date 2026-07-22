import { formatRelativeTime, shouldShowCommitter } from '../utils/date';
import './CommitHeader.css';

export default function CommitHeader({ commit }) {
  if (!commit) return null;

  const { author, committer, subject, body, oid, parents } = commit;
  const showCommitter = shouldShowCommitter(author, committer);

  return (
    <header className="commit-header">
      <div className="commit-header__row">
        {/* Avatar + subject stay side-by-side (0.5rem) on all breakpoints */}
        <div className="commit-header__main">
          <img
            className="commit-header__avatar"
            src={author.avatarUrl}
            alt=""
            width={40}
            height={40}
          />
          <div className="commit-header__left">
            <h1 className="commit-header__subject">{subject}</h1>
            <p className="commit-header__author">
              <span className="commit-header__muted">Authored by </span>
              <strong>{author.name}</strong>
              <span className="commit-header__muted">
                {' '}
                {formatRelativeTime(author.date)}
              </span>
            </p>
            {body ? <p className="commit-header__body">{body}</p> : null}
          </div>
        </div>

        <div className="commit-header__right">
          {showCommitter && (
            <p className="commit-header__committer">
              <span className="commit-header__muted">Commited by </span>
              <strong>{committer.name}</strong>
              <span className="commit-header__muted">
                {' '}
                {formatRelativeTime(committer.date)}
              </span>
            </p>
          )}
          <div className="commit-header__sha-row">
            <span className="commit-header__sha-label">Commit </span>
            <strong className="commit-header__sha-value">{oid}</strong>
          </div>
          {(parents || []).map((parent) => (
            <div className="commit-header__sha-row" key={parent.oid}>
              <span className="commit-header__sha-label">Parent </span>
              <span className="commit-header__sha-value commit-header__sha-value--link">
                {parent.oid}
              </span>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
