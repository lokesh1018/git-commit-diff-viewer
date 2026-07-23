import { useEffect, useState } from 'react';
import {
  fetchCommit,
  fetchCommitDiff,
  isValidCommitSha,
} from '../api/commitApi';

function makeError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

export function useCommit(owner, repository, commitSHA) {
  const [commit, setCommit] = useState(null);
  const [diff, setDiff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setCommit(null);
      setDiff(null);

      if (!owner || !repository || !commitSHA) {
        setError(
          makeError(
            'Missing owner, repository, or commit SHA in the URL.',
            400,
            'INVALID_ROUTE',
          ),
        );
        setLoading(false);
        return;
      }

      if (!isValidCommitSha(commitSHA)) {
        setError(
          makeError(
            `Invalid commit SHA: expected a 40-character hexadecimal string, got "${commitSHA}"`,
            400,
            'INVALID_OID',
          ),
        );
        setLoading(false);
        return;
      }

      const oid = commitSHA.trim().toLowerCase();

      try {
        // Both routes share one GitHub fetch on the backend (cache + inflight).
        const [commitResult, diffResult] = await Promise.all([
          fetchCommit(owner, repository, oid),
          fetchCommitDiff(owner, repository, oid),
        ]);

        if (cancelled) return;

        // Swagger: Commit metadata is a one-element array.
        const commitData = Array.isArray(commitResult)
          ? commitResult[0]
          : commitResult;

        if (!commitData || typeof commitData !== 'object') {
          throw makeError(
            'API returned an empty or invalid commit payload.',
            502,
            'INVALID_RESPONSE',
          );
        }

        setCommit(commitData);
        setDiff(Array.isArray(diffResult) ? diffResult : []);
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

    // Ignore late responses if the route params change or the component unmounts.
    return () => {
      cancelled = true;
    };
  }, [owner, repository, commitSHA]);

  return { commit, diff, loading, error };
}
