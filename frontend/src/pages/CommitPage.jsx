import { useParams } from 'react-router-dom';
import { useCommit } from '../hooks/useCommit';
import CommitHeader from '../components/CommitHeader';
import FileDiffBlock from '../components/FileDiffBlock';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import './CommitPage.css';

export default function CommitPage() {
  const { owner, repository, commitSHA } = useParams();
  const { commit, diff, loading, error } = useCommit(
    owner,
    repository,
    commitSHA,
  );

  if (loading) {
    return (
      <div className="commit-page">
        <div className="commit-page__inner">
          <Loader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="commit-page">
        <div className="commit-page__inner">
          <ErrorState error={error} />
        </div>
      </div>
    );
  }

  if (!commit) {
    return (
      <div className="commit-page">
        <div className="commit-page__inner">
          <ErrorState
            error={{
              status: 404,
              code: 'NOT_FOUND',
              message: 'No commit data was returned for this URL.',
            }}
          />
        </div>
      </div>
    );
  }

  const files = Array.isArray(diff) ? diff : [];

  return (
    <div className="commit-page">
      <div className="commit-page__inner">
        <CommitHeader commit={commit} />
        <div className="commit-page__files">
          {files.length === 0 ? (
            <p className="commit-page__empty">No files changed in this commit.</p>
          ) : (
            files.map((fileDiff, index) => (
              <FileDiffBlock
                key={`${fileDiff?.headFile?.path || fileDiff?.baseFile?.path || 'file'}-${index}`}
                fileDiff={fileDiff}
                defaultExpanded={index === 0}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
