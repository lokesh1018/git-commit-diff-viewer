/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCommit } from './useCommit';

vi.mock('../api/commitApi', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchCommit: vi.fn(),
    fetchCommitDiff: vi.fn(),
  };
});

import { fetchCommit, fetchCommitDiff } from '../api/commitApi';

const OID = 'a1bf367b3af680b1182cc52bb77ba095764a11f9';

describe('useCommit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets INVALID_ROUTE when route params are missing', async () => {
    const { result } = renderHook(() => useCommit('', 'clay', OID));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toMatchObject({
      status: 400,
      code: 'INVALID_ROUTE',
    });
    expect(fetchCommit).not.toHaveBeenCalled();
  });

  it('sets INVALID_OID for a bad commit SHA', async () => {
    const { result } = renderHook(() =>
      useCommit('golemfactory', 'clay', 'not-a-sha'),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toMatchObject({
      status: 400,
      code: 'INVALID_OID',
    });
    expect(fetchCommit).not.toHaveBeenCalled();
  });

  it('loads commit and diff on success', async () => {
    fetchCommit.mockResolvedValue([
      { oid: OID, subject: 'Fix', body: '', author: {}, committer: {} },
    ]);
    fetchCommitDiff.mockResolvedValue([
      { changeKind: 'MODIFIED', hunks: [] },
    ]);

    const { result } = renderHook(() =>
      useCommit('golemfactory', 'clay', OID),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.commit.subject).toBe('Fix');
    expect(result.current.diff).toHaveLength(1);
    expect(fetchCommit).toHaveBeenCalledWith('golemfactory', 'clay', OID);
    expect(fetchCommitDiff).toHaveBeenCalledWith('golemfactory', 'clay', OID);
  });

  it('normalizes uppercase SHA before calling the API', async () => {
    fetchCommit.mockResolvedValue([{ oid: OID, subject: 'x' }]);
    fetchCommitDiff.mockResolvedValue([]);

    const { result } = renderHook(() =>
      useCommit('golemfactory', 'clay', OID.toUpperCase()),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchCommit).toHaveBeenCalledWith(
      'golemfactory',
      'clay',
      OID.toLowerCase(),
    );
  });

  it('surfaces API errors from fetchCommit', async () => {
    const apiError = Object.assign(new Error('Repository or commit not found'), {
      status: 404,
      code: 'NOT_FOUND',
    });
    fetchCommit.mockRejectedValue(apiError);
    fetchCommitDiff.mockResolvedValue([]);

    const { result } = renderHook(() =>
      useCommit('golemfactory', 'clay', OID),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
    expect(result.current.commit).toBeNull();
  });

  it('rejects empty commit payloads', async () => {
    fetchCommit.mockResolvedValue([]);
    fetchCommitDiff.mockResolvedValue([]);

    const { result } = renderHook(() =>
      useCommit('golemfactory', 'clay', OID),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toMatchObject({
      status: 502,
      code: 'INVALID_RESPONSE',
    });
  });
});
