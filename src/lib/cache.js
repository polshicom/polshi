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

export function cacheSet(key, value, ttl = DEFAULT_TTL) {
  store.set(key, { value, expires: Date.now() + ttl })
}
