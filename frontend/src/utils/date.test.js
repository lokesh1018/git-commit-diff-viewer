import { describe, it, expect } from 'vitest';
import {
  shouldShowCommitter,
  isSameAuthorCommitterDate,
  formatRelativeTime,
} from '../utils/date';

describe('shouldShowCommitter', () => {
  const date = '2024-01-15T12:00:00Z';

  it('returns false when author and committer match', () => {
    expect(
      shouldShowCommitter(
        { name: 'Ada', date },
        { name: 'Ada', date },
      ),
    ).toBe(false);
  });

  it('returns true when names differ', () => {
    expect(
      shouldShowCommitter(
        { name: 'Ada', date },
        { name: 'GitHub', date },
      ),
    ).toBe(true);
  });

  it('returns true when dates differ', () => {
    expect(
      shouldShowCommitter(
        { name: 'Ada', date },
        { name: 'Ada', date: '2024-01-16T12:00:00Z' },
      ),
    ).toBe(true);
  });

  it('returns false for missing author/committer', () => {
    expect(shouldShowCommitter(null, { name: 'Ada', date })).toBe(false);
    expect(shouldShowCommitter({ name: 'Ada', date }, null)).toBe(false);
  });
});

describe('isSameAuthorCommitterDate', () => {
  it('compares timestamps, not just string equality of formats', () => {
    expect(
      isSameAuthorCommitterDate(
        { date: '2024-01-15T12:00:00.000Z' },
        { date: '2024-01-15T12:00:00Z' },
      ),
    ).toBe(true);
  });

  it('returns false for different instants', () => {
    expect(
      isSameAuthorCommitterDate(
        { date: '2024-01-15T12:00:00Z' },
        { date: '2024-01-15T13:00:00Z' },
      ),
    ).toBe(false);
  });
});

describe('formatRelativeTime', () => {
  const now = Date.parse('2024-06-15T12:00:00Z');

  it('returns empty string for invalid input', () => {
    expect(formatRelativeTime('', now)).toBe('');
    expect(formatRelativeTime('not-a-date', now)).toBe('');
  });

  it('formats recent times', () => {
    expect(formatRelativeTime('2024-06-15T11:59:30Z', now)).toBe('just now');
    expect(formatRelativeTime('2024-06-15T11:00:00Z', now)).toBe('an hour ago');
    expect(formatRelativeTime('2024-06-11T12:00:00Z', now)).toBe(
      'four days ago',
    );
  });

  it('falls back to numerals for large counts', () => {
    expect(formatRelativeTime('2024-05-15T12:00:00Z', now)).toBe('a month ago');
    expect(formatRelativeTime('2022-06-15T12:00:00Z', now)).toBe('two years ago');
  });
});
