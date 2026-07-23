import DiffLine from './DiffLine';
import './DiffHunk.css';

export default function DiffHunk({ hunk }) {
  if (!hunk || typeof hunk !== 'object') return null;

  const header = hunk.header || '';
  const lines = Array.isArray(hunk.lines) ? hunk.lines : [];

  return (
    <div className="diff-hunk">
      {header ? <div className="diff-hunk__header">{header}</div> : null}
      <div className="diff-hunk__lines">
        {lines.map((line, index) => (
          <DiffLine
            key={`${header}-${index}-${line?.baseLineNumber}-${line?.headLineNumber}`}
            line={line}
          />
        ))}
      </div>
    </div>
  );
}
