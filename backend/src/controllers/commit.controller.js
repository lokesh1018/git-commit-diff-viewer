const githubService = require('../services/github.service');

async function getCommit(req, res, next) {
  try {
    const { owner, repository, oid } = req.params;
    const result = await githubService.getCommit(owner, repository, oid);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getCommitDiff(req, res, next) {
  try {
    const { owner, repository, oid } = req.params;
    const result = await githubService.getCommitDiff(owner, repository, oid);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCommit,
  getCommitDiff,
};
