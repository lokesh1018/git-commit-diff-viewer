import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isValidCommitSha,
  fetchCommit,
  fetchCommitDiff,
} from './commitApi';

describe('isValidCommitSha', () => {
  it('accepts 40-char hex (case-insensitive)', () => {
    expect(
      isValidCommitSha('a1bf367b3af680b1182cc52bb77ba095764a11f9'),
    ).toBe(true);
    expect(
      isValidCommitSha('A1BF367B3AF680B1182CC52BB77BA095764A11F9'),
    ).toBe(true);
  });

  it('rejects invalid values', () => {
    expect(isValidCommitSha('')).toBe(false);
    expect(isValidCommitSha('short')).toBe(false);
    expect(isValidCommitSha(null)).toBe(false);
    expect(
      isValidCommitSha('zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz'),
    ).toBe(false);
  });
});

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name) =>
        String(name).toLowerCase() === 'content-type'
          ? 'application/json'
          : null,
    },
    json: async () => body,
  };
}

describe('commitApi fetch helpers', () => {
  const oid = 'a1bf367b3af680b1182cc52bb77ba095764a11f9';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchCommit returns JSON payload on success', async () => {
    const payload = [{ oid, subject: 'Hi', body: '' }];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(200, payload)),
    );

    const result = await fetchCommit('golemfactory', 'clay', oid);
    expect(result).toEqual(payload);
    expect(fetch).toHaveBeenCalledWith(
      `/repositories/golemfactory/clay/commits/${oid}`,
    );
  });

  it('fetchCommitDiff returns JSON payload on success', async () => {
    const payload = [{ changeKind: 'MODIFIED', hunks: [] }];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(200, payload)),
    );

    const result = await fetchCommitDiff('golemfactory', 'clay', oid);
    expect(result).toEqual(payload);
    expect(fetch).toHaveBeenCalledWith(
      `/repositories/golemfactory/clay/commits/${oid}/diff`,
    );
  });

  it('maps API error JSON to thrown error with status/code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(404, {
          error: 'NOT_FOUND',
          message: 'Repository or commit not found',
        }),
      ),
    );

    await expect(fetchCommit('golemfactory', 'clay', oid)).rejects.toMatchObject(
      {
        message: 'Repository or commit not found',
        status: 404,
        code: 'NOT_FOUND',
      },
    );
  });

  it('maps network failures to NETWORK_ERROR', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Failed to fetch')),
    );

    await expect(
      fetchCommitDiff('golemfactory', 'clay', oid),
    ).rejects.toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
    });
  });

  it('rejects non-JSON success responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'text/plain' },
        json: async () => {
          throw new Error('not json');
        },
      }),
    );

    await expect(fetchCommit('golemfactory', 'clay', oid)).rejects.toMatchObject(
      {
        status: 502,
        code: 'INVALID_RESPONSE',
      },
    );
  });
});
