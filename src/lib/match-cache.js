/**
 * Persistent match cache — stores LLM verification results in Supabase
 * so each unique market pair is verified exactly once.
 *
 * Falls back to in-memory cache if Supabase is not configured.
 */

import { createClient } from '@supabase/supabase-js'

const memoryCache = new Map()

let supabaseClient = null
function getClient() {
  if (supabaseClient) return supabaseClient
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return null
    supabaseClient = createClient(url, key)
    return supabaseClient
  } catch {
    return null
  }
}

export async function getCached(pairHashes) {
  if (pairHashes.length === 0) return new Map()

  const results = new Map()
  const uncached = []

  // Check memory cache first
  for (const hash of pairHashes) {
    const entry = memoryCache.get(hash)
    if (entry) {
      results.set(hash, entry)
    } else {
      uncached.push(hash)
    }
  }

  if (uncached.length === 0) return results

  // Check Supabase
  const client = getClient()
  if (client) {
    try {
      // Batch lookup in chunks of 100
      for (let i = 0; i < uncached.length; i += 100) {
        const chunk = uncached.slice(i, i + 100)
        const { data } = await client
          .from('match_cache')
          .select('pair_hash, result')
          .in('pair_hash', chunk)

        if (data) {
          for (const row of data) {
            const parsed = typeof row.result === 'string' ? JSON.parse(row.result) : row.result
            results.set(row.pair_hash, parsed)
            memoryCache.set(row.pair_hash, parsed)
          }
        }
      }
    } catch (err) {
      console.error('[match-cache] Supabase read error:', err.message)
    }
  }

  return results
}

export async function setCached(entries) {
  if (entries.length === 0) return

  // Always update memory cache
  for (const { hash, result } of entries) {
    memoryCache.set(hash, result)
  }

  // Persist to Supabase
  const client = getClient()
  if (!client) return

  try {
    const rows = entries.map(({ hash, polyQ, kalshiQ, result, model }) => ({
      pair_hash: hash,
      poly_question: polyQ,
      kalshi_question: kalshiQ,
      result,
      model_used: model || 'claude-haiku-4-5-20251001',
      created_at: new Date().toISOString(),
    }))

    const { error } = await client
      .from('match_cache')
      .upsert(rows, { onConflict: 'pair_hash' })

    if (error) console.error('[match-cache] Supabase write error:', error.message)
  } catch (err) {
    console.error('[match-cache] Supabase write error:', err.message)
  }
}

export function getCacheStats() {
  return { memoryCacheSize: memoryCache.size }
}
