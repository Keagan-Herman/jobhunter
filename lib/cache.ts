type CacheEntry<T> = {
  value: T
  expiresAt: number
}

class SimpleCache<T> {
  private store = new Map<string, CacheEntry<T>>()

  set(key: string, value: T, ttlSeconds: number = 3600) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    })
  }

  get(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  clear() {
    this.store.clear()
  }
}

// Score cache — keyed by job external_id + user_id
export const scoreCache = new SimpleCache<{ score: number, reason: string }>()