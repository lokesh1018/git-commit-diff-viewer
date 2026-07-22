/**
 * Simple in-memory cache keyed by string.
 * Commit data is immutable, so entries are kept indefinitely.
 */
class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    if (!this.store.has(key)) {
      return undefined;
    }
    return this.store.get(key);
  }

  set(key, value) {
    this.store.set(key, value);
    return value;
  }

  has(key) {
    return this.store.has(key);
  }

  clear() {
    this.store.clear();
  }
}

module.exports = new MemoryCache();
