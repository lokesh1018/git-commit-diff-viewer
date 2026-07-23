const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { splitMessage } = require('../src/services/github.service');
const { createError } = require('../src/middleware/errorHandler');

describe('splitMessage', () => {
  it('returns subject only when there is no newline', () => {
    assert.deepEqual(splitMessage('Fix bug'), {
      subject: 'Fix bug',
      body: '',
    });
  });

  it('splits subject and body and strips leading blank lines from body', () => {
    assert.deepEqual(
      splitMessage('Subject line\n\nBody paragraph\nMore body'),
      {
        subject: 'Subject line',
        body: 'Body paragraph\nMore body',
      },
    );
  });

  it('normalizes CRLF in the body', () => {
    assert.deepEqual(splitMessage('Title\r\n\r\nLine one\r\nLine two'), {
      subject: 'Title',
      body: 'Line one\nLine two',
    });
  });

  it('handles empty / null message', () => {
    assert.deepEqual(splitMessage(''), { subject: '', body: '' });
    assert.deepEqual(splitMessage(null), { subject: '', body: '' });
  });
});

describe('createError', () => {
  it('attaches status, code, and details', () => {
    const err = createError(404, 'Not found', 'NOT_FOUND', { id: 1 });
    assert.equal(err.status, 404);
    assert.equal(err.message, 'Not found');
    assert.equal(err.code, 'NOT_FOUND');
    assert.deepEqual(err.details, { id: 1 });
  });
});
