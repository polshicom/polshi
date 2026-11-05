import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const store = new Map()

const DEFAULT_TTL = 15_000 // 15 seconds

const DISK_DIR = join(process.cwd(), '.cache')
const PERSIST_KEYS = new Set(['matched_markets_v2', 'top_arb_of_day', 'scanner_stats', 'explore_markets'])

try { mkdirSync(DISK_DIR, { recursive: true }) } catch {}

function diskPath(key) {
  return join(DISK_DIR, `${key.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`)
}

function loadFromDisk(key) {
  try {
    const raw = readFileSync(diskPath(key), 'utf-8')
    const entry = JSON.parse(raw)
    if (entry && entry.value != null) return entry
  } catch {}
  return null
}

function saveToDisk(key, entry) {
  try {
    writeFileSync(diskPath(key), JSON.stringify(entry))
  } catch {}
}

export function cacheGet(key) {
  const entry = store.get(key)
  if (!entry) {
    if (PERSIST_KEYS.has(key)) {
      const disk = loadFromDisk(key)
      if (disk) {
        store.set(key, disk)
        return disk.value
      }
    }
    return null
  }
  if (Date.now() > entry.expires) {
    store.delete(key)
    return null
  }
  return entry.value
}

export function cacheGetWithMeta(key) {
  let entry = store.get(key)
  if (!entry && PERSIST_KEYS.has(key)) {
    const disk = loadFromDisk(key)
    if (disk) {
      store.set(key, disk)
      entry = disk
    }
  }
  if (!entry) return { value: null, age: Infinity, timestamp: null, stale: true }
  const now = Date.now()
  const age = now - entry.created
  const stale = now > entry.expires
  return { value: entry.value, age, timestamp: entry.created, stale }
}

export function cacheSet(key, value, ttl = DEFAULT_TTL) {
  const entry = { value, expires: Date.now() + ttl, created: Date.now() }
  store.set(key, entry)
  if (PERSIST_KEYS.has(key)) {
    saveToDisk(key, entry)
  }
}

export function cacheHas(key) {
  if (store.has(key)) return true
  if (PERSIST_KEYS.has(key) && loadFromDisk(key)) return true
  return false
}
