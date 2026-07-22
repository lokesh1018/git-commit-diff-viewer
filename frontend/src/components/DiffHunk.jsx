import DiffLine from './DiffLine';
import './DiffHunk.css';

export default function DiffHunk({ hunk }) {
  return (
    <div className="diff-hunk">
      <div className="diff-hunk__header">{hunk.header}</div>
      <div className="diff-hunk__lines">
        {(hunk.lines || []).map((line, index) => (
          <DiffLine
            key={`${hunk.header}-${index}-${line.baseLineNumber}-${line.headLineNumber}`}
            line={line}
          />
        ))}
      </div>
    </div>
  );
}
