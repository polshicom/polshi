const store = new Map()

const DEFAULT_TTL = 15_000 // 15 seconds

export function cacheGet(key) {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) {
    store.delete(key)
    return null
  }
  return entry.value
}

/**
 * Returns cached value even if expired (stale), plus metadata.
 * Callers can serve stale data while a background refresh runs.
 */
export function cacheGetWithMeta(key) {
  const entry = store.get(key)
  if (!entry) return { value: null, age: Infinity, timestamp: null, stale: true }
  const now = Date.now()
  const age = now - entry.created
  const stale = now > entry.expires
  return { value: entry.value, age, timestamp: entry.created, stale }
}

export function cacheSet(key, value, ttl = DEFAULT_TTL) {
  store.set(key, { value, expires: Date.now() + ttl, created: Date.now() })
}

export function cacheHas(key) {
  return store.has(key)
}
