const express = require('express');
const commitController = require('../controllers/commit.controller');

const router = express.Router();

router.get(
  '/:owner/:repository/commits/:oid',
  commitController.getCommit,
);

router.get(
  '/:owner/:repository/commits/:oid/diff',
  commitController.getCommitDiff,
);

module.exports = router;
