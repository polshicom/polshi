/**
 * Shadow pipeline — GPT-4o mini verification
 *
 * Same interface as llm-verify.js but calls OpenAI instead of Anthropic.
 * Used only in shadow/comparison mode, never affects production output.
 */

const MODEL = 'gpt-4o-mini'
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

async function callOpenAI(pairs) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        temperature: 0,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(pairs) },
        ],
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[gpt-verify] OpenAI API error ${res.status}: ${body.slice(0, 200)}`)
      return null
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || ''

    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('[gpt-verify] No JSON array in response:', text.slice(0, 200))
      return null
    }

    return JSON.parse(jsonMatch[0])
  } catch (err) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') {
      console.error('[gpt-verify] Request timed out')
    } else {
      console.error('[gpt-verify] Error:', err.message)
    }
    return null
  }
}

export async function gptVerifyPairs(pairs) {
  if (pairs.length === 0) return new Map()

  if (!process.env.OPENAI_API_KEY) {
    console.warn('[gpt-verify] OPENAI_API_KEY not set — skipping GPT verification')
    return new Map()
  }

  const results = new Map()

  for (let i = 0; i < pairs.length; i += MAX_BATCH) {
    const batch = pairs.slice(i, i + MAX_BATCH)
    const gptResults = await callOpenAI(batch)

    if (!gptResults || !Array.isArray(gptResults)) {
      console.error(`[gpt-verify] Batch ${Math.floor(i / MAX_BATCH) + 1} failed — skipping`)
      continue
    }

    for (const r of gptResults) {
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

  console.log(`[gpt-verify] Verified ${results.size}/${pairs.length} pairs`)
  return results
}
