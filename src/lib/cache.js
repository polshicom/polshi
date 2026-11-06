import { getSupabaseAdmin } from './supabase.js'

// In-memory L1 cache — fast within a single warm lambda instance, but
// each Vercel serverless invocation can land on a different instance
// with its own empty memory. PERSIST_KEYS are backed by a Supabase
// table (scan_cache) so every instance sees the same data regardless
// of which one actually ran the scan.
const store = new Map()

const DEFAULT_TTL = 15_000 // 15 seconds

const PERSIST_KEYS = new Set([
  'matched_markets_v2',
  'top_arb_of_day',
  'scanner_stats',
  'explore_markets',
  'whale_yesterday',
  'whale_trades',
  'pipeline_comparison',
  'shadow_pipeline_last_run',
])

async function loadFromDb(key) {
  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('scan_cache')
      .select('value, created_at, expires_at')
      .eq('key', key)
      .maybeSingle()
    if (error || !data) return null
    return {
      value: data.value,
      created: new Date(data.created_at).getTime(),
      expires: new Date(data.expires_at).getTime(),
    }
  } catch {
    return null
  }
}

async function saveToDb(key, entry) {
  try {
    const admin = getSupabaseAdmin()
    await admin.from('scan_cache').upsert({
      key,
      value: entry.value,
      created_at: new Date(entry.created).toISOString(),
      expires_at: new Date(entry.expires).toISOString(),
    })
  } catch (err) {
    console.error('[cache] Failed to persist to Supabase:', err.message)
  }
}

export async function cacheGet(key) {
  const entry = store.get(key)
  if (entry && Date.now() <= entry.expires) return entry.value
  if (PERSIST_KEYS.has(key)) {
    const db = await loadFromDb(key)
    if (db) {
      store.set(key, db)
      return db.value
    }
  }
  if (entry) store.delete(key)
  return null
}

export async function cacheGetWithMeta(key) {
  let entry = store.get(key)
  if ((!entry || Date.now() > entry.expires) && PERSIST_KEYS.has(key)) {
    const db = await loadFromDb(key)
    if (db) {
      store.set(key, db)
      entry = db
    }
  }
  if (!entry) return { value: null, age: Infinity, timestamp: null, stale: true }
  const now = Date.now()
  const age = now - entry.created
  const stale = now > entry.expires
  return { value: entry.value, age, timestamp: entry.created, stale }
}

export async function cacheSet(key, value, ttl = DEFAULT_TTL) {
  const entry = { value, expires: Date.now() + ttl, created: Date.now() }
  store.set(key, entry)
  if (PERSIST_KEYS.has(key)) {
    await saveToDb(key, entry)
  }
}

export async function cacheHas(key) {
  if (store.has(key)) return true
  if (PERSIST_KEYS.has(key)) {
    const db = await loadFromDb(key)
    return !!db
  }
  return false
}
