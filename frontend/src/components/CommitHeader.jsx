import { useEffect, useState } from 'react';
import {
  formatRelativeTime,
  shouldShowCommitter,
  isSameAuthorCommitterDate,
} from '../utils/date';
import './CommitHeader.css';

const FALLBACK_AVATAR =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="20" fill="#E7EBF1"/>
      <circle cx="20" cy="15" r="7" fill="#6D727C"/>
      <ellipse cx="20" cy="34" rx="12" ry="10" fill="#6D727C"/>
    </svg>`,
  );

export default function CommitHeader({ commit }) {
  const remoteAvatar = commit?.author?.avatarUrl || FALLBACK_AVATAR;
  const [avatarSrc, setAvatarSrc] = useState(remoteAvatar);

  useEffect(() => {
    setAvatarSrc(remoteAvatar);
  }, [remoteAvatar]);

  if (!commit) return null;

  const author = commit.author || {};
  const committer = commit.committer || {};
  const subject = commit.subject || '(no subject)';
  const body = commit.body || '';
  const oid = commit.oid || '';
  const parents = Array.isArray(commit.parents) ? commit.parents : [];
  const showCommitter = shouldShowCommitter(author, committer);
  // Show time only when dates differ (name-only mismatch still shows the line).
  const showCommitterTime =
    showCommitter && !isSameAuthorCommitterDate(author, committer);

  return (
    <header className="commit-header">
      <div className="commit-header__row">
        <div className="commit-header__main">
          <img
            className="commit-header__avatar"
            src={avatarSrc}
            alt=""
            width={40}
            height={40}
            onError={() => setAvatarSrc(FALLBACK_AVATAR)}
          />
          <div className="commit-header__left">
            <h1 className="commit-header__subject">{subject}</h1>
            <p className="commit-header__author">
              <span className="commit-header__muted">Authored by </span>
              <strong>{author.name || 'Unknown'}</strong>
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
              <strong>{committer.name || 'Unknown'}</strong>
              {showCommitterTime ? (
                <span className="commit-header__muted">
                  {' '}
                  {formatRelativeTime(committer.date)}
                </span>
              ) : null}
            </p>
          )}
          {oid ? (
            <div className="commit-header__sha-row">
              <span className="commit-header__sha-label">Commit </span>
              <strong className="commit-header__sha-value">{oid}</strong>
            </div>
          ) : null}
          {parents
            .filter((parent) => parent && parent.oid)
            .map((parent) => (
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
