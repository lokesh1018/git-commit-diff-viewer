import { useEffect, useState } from 'react';
import { fetchCommit, fetchCommitDiff } from '../api/commitApi';

export function useCommit(owner, repository, commitSHA) {
  const [commit, setCommit] = useState(null);
  const [diff, setDiff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!owner || !repository || !commitSHA) {
      return undefined;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setCommit(null);
      setDiff(null);

      try {
        const [commitResult, diffResult] = await Promise.all([
          fetchCommit(owner, repository, commitSHA),
          fetchCommitDiff(owner, repository, commitSHA),
        ]);

        if (cancelled) return;

        setCommit(Array.isArray(commitResult) ? commitResult[0] : commitResult);
        setDiff(diffResult);
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [owner, repository, commitSHA]);

  return { commit, diff, loading, error };
}
