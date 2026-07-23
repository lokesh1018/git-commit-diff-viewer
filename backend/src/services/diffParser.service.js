/**
 * Parse a GitHub unified-diff `patch` string into DiffHunk[].
 *
 * Line numbering rules:
 * - Context lines (" ") increment both base and head
 * - Removed lines ("-") increment only base
 * - Added lines ("+") increment only head
 * - Hunk headers "@@ -a,b +c,d @@" reset the counters (a/c are 1-based starts)
 */
function parsePatch(patch) {
  if (!patch || typeof patch !== 'string') {
    return [];
  }

  const hunks = [];
  let currentHunk = null;
  let baseLine = 0;
  let headLine = 0;

  const lines = patch.split('\n');

  for (const line of lines) {
    const hunkMatch = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)$/);

    if (hunkMatch) {
      if (currentHunk) {
        hunks.push(currentHunk);
      }

      baseLine = Number(hunkMatch[1]);
      headLine = Number(hunkMatch[2]);

      currentHunk = {
        header: line,
        lines: [],
      };
      continue;
    }

    if (
      line.startsWith('diff --git') ||
      line.startsWith('index ') ||
      line.startsWith('--- ') ||
      line.startsWith('+++ ') ||
      line.startsWith('Binary files') ||
      line.startsWith('new file mode') ||
      line.startsWith('deleted file mode') ||
      line.startsWith('old mode') ||
      line.startsWith('new mode') ||
      line.startsWith('similarity index') ||
      line.startsWith('rename from') ||
      line.startsWith('rename to') ||
      line.startsWith('copy from') ||
      line.startsWith('copy to')
    ) {
      continue;
    }

    if (!currentHunk) {
      continue;
    }

    if (line.startsWith('+')) {
      currentHunk.lines.push({
        baseLineNumber: null,
        headLineNumber: headLine,
        content: line,
      });
      headLine += 1;
    } else if (line.startsWith('-')) {
      currentHunk.lines.push({
        baseLineNumber: baseLine,
        headLineNumber: null,
        content: line,
      });
      baseLine += 1;
    } else if (line.startsWith(' ') || line === '') {
      const content = line === '' ? ' ' : line;
      currentHunk.lines.push({
        baseLineNumber: baseLine,
        headLineNumber: headLine,
        content,
      });
      baseLine += 1;
      headLine += 1;
    } else if (line.startsWith('\\')) {
      currentHunk.lines.push({
        baseLineNumber: null,
        headLineNumber: null,
        content: line,
      });
    }
  }

  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return hunks;
}

const STATUS_TO_CHANGE_KIND = {
  added: 'ADDED',
  removed: 'DELETED',
  modified: 'MODIFIED',
  renamed: 'RENAMED',
  copied: 'COPIED',
  changed: 'TYPE_CHANGED',
};

function mapChangeKind(status) {
  if (!status || typeof status !== 'string') {
    return 'MODIFIED';
  }
  return STATUS_TO_CHANGE_KIND[status] || 'MODIFIED';
}

/**
 * Map a GitHub commit file object to CombinedFileDifference.
 */
function mapFileDifference(file) {
  if (!file || typeof file !== 'object') {
    return {
      changeKind: 'MODIFIED',
      baseFile: null,
      headFile: { path: 'unknown' },
      hunks: [],
    };
  }

  const changeKind = mapChangeKind(file.status);
  const path =
    typeof file.filename === 'string' && file.filename
      ? file.filename
      : 'unknown';
  const previousPath =
    typeof file.previous_filename === 'string' && file.previous_filename
      ? file.previous_filename
      : path;

  let baseFile = null;
  let headFile = null;

  switch (changeKind) {
    case 'ADDED':
      baseFile = null;
      headFile = { path };
      break;
    case 'DELETED':
      baseFile = { path };
      headFile = null;
      break;
    case 'RENAMED':
    case 'COPIED':
      baseFile = { path: previousPath };
      headFile = { path };
      break;
    default:
      baseFile = { path };
      headFile = { path };
      break;
  }

  return {
    changeKind,
    baseFile,
    headFile,
    hunks: parsePatch(file.patch),
  };
}

module.exports = {
  parsePatch,
  mapChangeKind,
  mapFileDifference,
};
