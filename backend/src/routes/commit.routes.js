const express = require('express');
const commitController = require('../controllers/commit.controller');
const {
  validateRepoParams,
  validateOidParam,
} = require('../middleware/validate');

const router = express.Router();

router.get(
  '/:owner/:repository/commits/:oid',
  validateRepoParams,
  validateOidParam,
  commitController.getCommit,
);

router.get(
  '/:owner/:repository/commits/:oid/diff',
  validateRepoParams,
  validateOidParam,
  commitController.getCommitDiff,
);

module.exports = router;
