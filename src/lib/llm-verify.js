/**
 * Stage 2 — LLM Verification
 *
 * Sends candidate pairs to Claude Haiku for structured verification.
 * Each pair is checked exactly once (results cached by match-cache.js).
 * No external SDK — uses raw fetch to the Anthropic Messages API.
 */

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_BATCH = 25
const TIMEOUT_MS = 30_000

const SYSTEM_PROMPT = `You are a prediction market analyst comparing pairs of markets from different platforms (Polymarket and Kalshi).

For each pair, determine whether they resolve under IDENTICAL conditions — meaning a YES bet on Market A pays out if and only if a YES bet on Market B pays out.

Markets that are RELATED but have different resolution criteria are NOT the same market. Pay close attention to:
- Different actions: "win" vs "run for" vs "be nominated"
- Different timeframes: "before July" vs "before December"
- Different thresholds: "$100K" vs "$150K"
- Different scopes: "win championship" vs "win group stage"

Return ONLY a JSON array. For each pair:
{
  "pair_id": <number>,
  "same_market": <boolean>,
  "confidence": <0-100>,
  "same_resolution": <boolean>,
  "same_subject": <boolean>,
  "same_date": <boolean>,
  "same_numeric_condition": <boolean>,
  "canonical": "<one-line description of what this market resolves on>",
  "explanation": "<one sentence>"
}`

function buildUserPrompt(pairs) {
  const lines = pairs.map((p, i) => {
    let block = `[${i + 1}] A: "${p.polyQ}"\n    B: "${p.kalshiQ}"`
    if (p.polyDesc) block += `\n    A rules: "${p.polyDesc.slice(0, 300)}"`
    if (p.kalshiDesc) block += `\n    B rules: "${p.kalshiDesc.slice(0, 300)}"`
    return block
  })
  return `Evaluate these ${pairs.length} market pairs:\n\n${lines.join('\n\n')}`
}

async function callAnthropic(pairs) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserPrompt(pairs) }],
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[llm-verify] Anthropic API error ${res.status}: ${body.slice(0, 200)}`)
      return null
    }

    const data = await res.json()
    const text = data.content?.[0]?.text || ''

    // Extract JSON array from response (may be wrapped in markdown code blocks)
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('[llm-verify] No JSON array in response:', text.slice(0, 200))
      return null
    }

    return JSON.parse(jsonMatch[0])
  } catch (err) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') {
      console.error('[llm-verify] Request timed out')
    } else {
      console.error('[llm-verify] Error:', err.message)
    }
    return null
  }
}

/**
 * Verify a list of candidate pairs via the LLM.
 * Batches automatically if more than MAX_BATCH pairs.
 *
 * @param {Array<{hash, polyQ, kalshiQ, polyDesc, kalshiDesc}>} pairs
 * @returns {Map<string, object>} hash → LLM result
 */
export async function verifyPairs(pairs) {
  if (pairs.length === 0) return new Map()

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[llm-verify] ANTHROPIC_API_KEY not set — skipping LLM verification')
    return new Map()
  }

  const results = new Map()

  // Process in batches
  for (let i = 0; i < pairs.length; i += MAX_BATCH) {
    const batch = pairs.slice(i, i + MAX_BATCH)
    const llmResults = await callAnthropic(batch)

    if (!llmResults || !Array.isArray(llmResults)) {
      console.error(`[llm-verify] Batch ${Math.floor(i / MAX_BATCH) + 1} failed — skipping`)
      continue
    }

    for (const r of llmResults) {
      const idx = (r.pair_id || 1) - 1
      if (idx >= 0 && idx < batch.length) {
        results.set(batch[idx].hash, {
          same_market: r.same_market ?? false,
          confidence: r.confidence ?? 0,
          same_resolution: r.same_resolution ?? false,
          same_subject: r.same_subject ?? false,
          same_date: r.same_date ?? false,
          same_numeric_condition: r.same_numeric_condition ?? true,
          canonical: r.canonical || '',
          explanation: r.explanation || '',
        })
      }
    }
  }

  console.log(`[llm-verify] Verified ${results.size}/${pairs.length} pairs`)
  return results
}
