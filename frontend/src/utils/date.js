/**
 * Show committer line only when name or date differs from author.
 */
export function shouldShowCommitter(author, committer) {
  if (!author || !committer) return false;

  const sameName = author.name === committer.name;
  const sameDate = author.date === committer.date;

  return !(sameName && sameDate);
}

/**
 * Format an ISO date as a relative time string, e.g. "four days ago".
 */
const UNIT_WORDS = {
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten',
};

function wordOrNumber(n) {
  return UNIT_WORDS[n] || String(n);
}

export function formatRelativeTime(isoDate, now = Date.now()) {
  if (!isoDate) return '';

  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return '';

  const diffMs = Math.max(0, now - then);
  const seconds = Math.floor(diffMs / 1000);

  if (seconds < 45) return 'just now';
  if (seconds < 90) return 'a minute ago';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 45) {
    return minutes === 1
      ? 'a minute ago'
      : `${wordOrNumber(minutes)} minutes ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 36) {
    return hours === 1 ? 'an hour ago' : `${wordOrNumber(hours)} hours ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return days === 1 ? 'a day ago' : `${wordOrNumber(days)} days ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return months === 1 ? 'a month ago' : `${wordOrNumber(months)} months ago`;
  }

  const years = Math.floor(days / 365);
  return years === 1 ? 'a year ago' : `${wordOrNumber(years)} years ago`;
}
