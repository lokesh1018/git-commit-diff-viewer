const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  parsePatch,
  mapChangeKind,
  mapFileDifference,
} = require('../src/services/diffParser.service');

describe('parsePatch', () => {
  it('returns empty array for missing or non-string patch', () => {
    assert.deepEqual(parsePatch(null), []);
    assert.deepEqual(parsePatch(undefined), []);
    assert.deepEqual(parsePatch(''), []);
    assert.deepEqual(parsePatch(42), []);
  });

  it('parses a single hunk with context, removed, and added lines', () => {
    const patch = [
      '@@ -10,4 +10,5 @@ function example() {',
      ' context',
      '-removed',
      '+added',
      '+another',
      ' trailing',
    ].join('\n');

    const hunks = parsePatch(patch);
    assert.equal(hunks.length, 1);
    assert.equal(hunks[0].header, '@@ -10,4 +10,5 @@ function example() {');
    assert.deepEqual(hunks[0].lines, [
      { baseLineNumber: 10, headLineNumber: 10, content: ' context' },
      { baseLineNumber: 11, headLineNumber: null, content: '-removed' },
      { baseLineNumber: null, headLineNumber: 11, content: '+added' },
      { baseLineNumber: null, headLineNumber: 12, content: '+another' },
      { baseLineNumber: 12, headLineNumber: 13, content: ' trailing' },
    ]);
  });

  it('parses multiple hunks and preserves headers', () => {
    const patch = [
      '@@ -1,2 +1,2 @@',
      ' a',
      '-b',
      '+c',
      '@@ -50,1 +50,1 @@',
      '-old',
      '+new',
    ].join('\n');

    const hunks = parsePatch(patch);
    assert.equal(hunks.length, 2);
    assert.equal(hunks[0].header, '@@ -1,2 +1,2 @@');
    assert.equal(hunks[1].header, '@@ -50,1 +50,1 @@');
    assert.equal(hunks[1].lines[0].baseLineNumber, 50);
    assert.equal(hunks[1].lines[1].headLineNumber, 50);
  });

  it('skips file-level headers and still parses hunks', () => {
    const patch = [
      'diff --git a/foo.js b/foo.js',
      'index abc..def 100644',
      '--- a/foo.js',
      '+++ b/foo.js',
      '@@ -1,1 +1,1 @@',
      '-old',
      '+new',
    ].join('\n');

    const hunks = parsePatch(patch);
    assert.equal(hunks.length, 1);
    assert.equal(hunks[0].lines.length, 2);
  });
});

describe('mapChangeKind', () => {
  it('maps GitHub statuses to changeKind enum', () => {
    assert.equal(mapChangeKind('added'), 'ADDED');
    assert.equal(mapChangeKind('removed'), 'DELETED');
    assert.equal(mapChangeKind('modified'), 'MODIFIED');
    assert.equal(mapChangeKind('renamed'), 'RENAMED');
    assert.equal(mapChangeKind('copied'), 'COPIED');
    assert.equal(mapChangeKind('changed'), 'TYPE_CHANGED');
  });

  it('defaults unknown or missing status to MODIFIED', () => {
    assert.equal(mapChangeKind('weird'), 'MODIFIED');
    assert.equal(mapChangeKind(null), 'MODIFIED');
    assert.equal(mapChangeKind(undefined), 'MODIFIED');
  });
});

describe('mapFileDifference', () => {
  it('maps ADDED with null baseFile', () => {
    const result = mapFileDifference({
      status: 'added',
      filename: 'new.js',
      patch: '@@ -0,0 +1,1 @@\n+hello',
    });
    assert.equal(result.changeKind, 'ADDED');
    assert.equal(result.baseFile, null);
    assert.deepEqual(result.headFile, { path: 'new.js' });
    assert.equal(result.hunks.length, 1);
  });

  it('maps DELETED with null headFile', () => {
    const result = mapFileDifference({
      status: 'removed',
      filename: 'gone.js',
    });
    assert.equal(result.changeKind, 'DELETED');
    assert.deepEqual(result.baseFile, { path: 'gone.js' });
    assert.equal(result.headFile, null);
    assert.deepEqual(result.hunks, []);
  });

  it('maps RENAMED using previous_filename', () => {
    const result = mapFileDifference({
      status: 'renamed',
      filename: 'new-name.js',
      previous_filename: 'old-name.js',
    });
    assert.equal(result.changeKind, 'RENAMED');
    assert.deepEqual(result.baseFile, { path: 'old-name.js' });
    assert.deepEqual(result.headFile, { path: 'new-name.js' });
  });

  it('handles null/invalid file objects safely', () => {
    const result = mapFileDifference(null);
    assert.equal(result.changeKind, 'MODIFIED');
    assert.deepEqual(result.headFile, { path: 'unknown' });
    assert.deepEqual(result.hunks, []);
  });

  it('returns empty hunks when patch is missing', () => {
    const result = mapFileDifference({
      status: 'modified',
      filename: 'binary.png',
    });
    assert.deepEqual(result.hunks, []);
  });
});
