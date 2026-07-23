import './DiffLine.css';

function lineKind(content) {
  if (!content) return 'context';
  if (content.startsWith('+')) return 'added';
  if (content.startsWith('-')) return 'removed';
  return 'context';
}

function splitContent(content) {
  if (!content) {
    return { prefix: ' ', text: '' };
  }
  const first = content[0];
  if (first === '+' || first === '-' || first === ' ') {
    return { prefix: first, text: content.slice(1) };
  }
  return { prefix: '', text: content };
}

export default function DiffLine({ line }) {
  if (!line || typeof line !== 'object') return null;

  const content = typeof line.content === 'string' ? line.content : ' ';
  const kind = lineKind(content);
  const { prefix, text } = splitContent(content);

  // null line numbers → blank gutter (added / removed / EOF marker lines)
  return (
    <div className={`diff-line diff-line--${kind}`}>
      <span className="diff-line__num diff-line__num--base">
        {line.baseLineNumber ?? ''}
      </span>
      <span className="diff-line__num diff-line__num--head">
        {line.headLineNumber ?? ''}
      </span>
      <pre className="diff-line__content">
        <span className="diff-line__prefix">{prefix}</span>
        <span className="diff-line__text">{text}</span>
      </pre>
    </div>
  );
}
