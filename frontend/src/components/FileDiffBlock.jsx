import { useState } from 'react';
import DiffHunk from './DiffHunk';
import chevronIcon from '../assets/chevron.svg';
import './FileDiffBlock.css';

function filePath(fileDiff) {
  if (!fileDiff || typeof fileDiff !== 'object') return 'unknown';
  if (fileDiff.headFile?.path) return fileDiff.headFile.path;
  if (fileDiff.baseFile?.path) return fileDiff.baseFile.path;
  return 'unknown';
}

export default function FileDiffBlock({ fileDiff, defaultExpanded = true }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!fileDiff) return null;

  const path = filePath(fileDiff);
  const hunks = Array.isArray(fileDiff.hunks) ? fileDiff.hunks : [];

  return (
    <section className="file-diff">
      <button
        type="button"
        className="file-diff__header"
        aria-expanded={expanded}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <img
          className={`file-diff__chevron ${expanded ? 'file-diff__chevron--expanded' : 'file-diff__chevron--collapsed'}`}
          src={chevronIcon}
          alt=""
          width={12}
          height={12}
          aria-hidden="true"
        />
        <span className="file-diff__path">{path}</span>
      </button>

      {expanded && (
        <div className="file-diff__body">
          {hunks.length === 0 ? (
            <p className="file-diff__empty">
              Diff unavailable (binary or large file).
            </p>
          ) : (
            <div className="file-diff__scroll">
              {hunks.map((hunk, index) => (
                <DiffHunk key={`${path}-hunk-${index}`} hunk={hunk} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
