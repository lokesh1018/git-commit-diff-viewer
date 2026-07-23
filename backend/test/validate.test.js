const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  validateOidParam,
  validateRepoParams,
  OID_PATTERN,
} = require('../src/middleware/validate');

function mockReq(params) {
  return { params: { ...params } };
}

describe('OID_PATTERN', () => {
  it('accepts 40-char lowercase hex', () => {
    assert.match('a1bf367b3af680b1182cc52bb77ba095764a11f9', OID_PATTERN);
  });

  it('rejects short or non-hex values', () => {
    assert.doesNotMatch('abc', OID_PATTERN);
    assert.doesNotMatch('zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz', OID_PATTERN);
    assert.doesNotMatch('A1BF367B3AF680B1182CC52BB77BA095764A11F9', OID_PATTERN);
  });
});

describe('validateOidParam', () => {
  it('normalizes uppercase SHA and calls next()', () => {
    const req = mockReq({
      oid: 'A1BF367B3AF680B1182CC52BB77BA095764A11F9',
    });
    let nextErr;
    validateOidParam(req, {}, (err) => {
      nextErr = err;
    });
    assert.equal(nextErr, undefined);
    assert.equal(req.params.oid, 'a1bf367b3af680b1182cc52bb77ba095764a11f9');
  });

  it('rejects invalid SHA with 400 INVALID_OID', () => {
    const req = mockReq({ oid: 'not-a-sha' });
    let nextErr;
    validateOidParam(req, {}, (err) => {
      nextErr = err;
    });
    assert.equal(nextErr.status, 400);
    assert.equal(nextErr.code, 'INVALID_OID');
  });

  it('rejects empty SHA', () => {
    const req = mockReq({ oid: '   ' });
    let nextErr;
    validateOidParam(req, {}, (err) => {
      nextErr = err;
    });
    assert.equal(nextErr.status, 400);
    assert.equal(nextErr.code, 'INVALID_OID');
  });
});

describe('validateRepoParams', () => {
  it('accepts valid owner and repository', () => {
    const req = mockReq({ owner: 'golemfactory', repository: 'clay' });
    let nextErr;
    validateRepoParams(req, {}, (err) => {
      nextErr = err;
    });
    assert.equal(nextErr, undefined);
    assert.equal(req.params.owner, 'golemfactory');
    assert.equal(req.params.repository, 'clay');
  });

  it('trims whitespace', () => {
    const req = mockReq({ owner: '  facebook  ', repository: '  react  ' });
    let nextErr;
    validateRepoParams(req, {}, (err) => {
      nextErr = err;
    });
    assert.equal(nextErr, undefined);
    assert.equal(req.params.owner, 'facebook');
    assert.equal(req.params.repository, 'react');
  });

  it('rejects invalid owner characters', () => {
    const req = mockReq({ owner: 'bad!!', repository: 'clay' });
    let nextErr;
    validateRepoParams(req, {}, (err) => {
      nextErr = err;
    });
    assert.equal(nextErr.status, 400);
    assert.equal(nextErr.code, 'INVALID_OWNER');
  });

  it('rejects empty repository', () => {
    const req = mockReq({ owner: 'golemfactory', repository: '' });
    let nextErr;
    validateRepoParams(req, {}, (err) => {
      nextErr = err;
    });
    assert.equal(nextErr.status, 400);
    assert.equal(nextErr.code, 'INVALID_REPOSITORY');
  });
});
