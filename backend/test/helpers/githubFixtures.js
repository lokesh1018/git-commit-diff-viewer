const OID_A = 'a1bf367b3af680b1182cc52bb77ba095764a11f9';
const OID_PARENT = 'b2cf367b3af680b1182cc52bb77ba095764a11f0';

function mockHeaders(map = {}) {
  const normalized = Object.fromEntries(
    Object.entries(map).map(([k, v]) => [k.toLowerCase(), v]),
  );
  return {
    get(name) {
      return normalized[String(name).toLowerCase()] ?? null;
    },
  };
}

function mockJsonResponse(status, body, headerMap = {}) {
  return {
    status,
    ok: status >= 200 && status < 300,
    statusText: status === 200 ? 'OK' : `Status ${status}`,
    headers: mockHeaders(headerMap),
    async json() {
      if (body instanceof Error) throw body;
      return body;
    },
  };
}

function sampleCommitPayload(overrides = {}) {
  return {
    sha: OID_A,
    commit: {
      message: 'Fix clay parser\n\nHandle empty hunks.',
      author: {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        date: '2024-01-15T12:00:00Z',
      },
      committer: {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        date: '2024-01-15T12:00:00Z',
      },
    },
    author: { avatar_url: 'https://avatars.example/ada.png' },
    committer: { avatar_url: 'https://avatars.example/ada.png' },
    parents: [{ sha: OID_PARENT }],
    files: [
      {
        status: 'modified',
        filename: 'src/main.rs',
        patch: '@@ -1,1 +1,1 @@\n-old\n+new',
      },
      {
        status: 'added',
        filename: 'README.md',
        patch: '@@ -0,0 +1,1 @@\n+# Hello',
      },
    ],
    ...overrides,
  };
}

module.exports = {
  OID_A,
  OID_PARENT,
  mockJsonResponse,
  sampleCommitPayload,
};
