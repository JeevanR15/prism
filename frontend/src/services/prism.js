// PRISM mock pipeline.
//
// Every "AI" step here is a deterministic mock: script-based language detection,
// regex PII redaction, keyword routing and a static knowledge base. If
// VITE_API_URL is set, queries go to the Flask backend instead (same response
// shape), falling back to this local mock if the backend is unreachable.

import responses from '../data/responses.json'
import laws from '../data/laws.json'

const API_URL = import.meta.env.VITE_API_URL

// ---------- 1. Language detection (Unicode script ranges) ----------
export function detectLanguage(text) {
  if (/[ఀ-౿]/.test(text)) return 'te'
  if (/[ऀ-ॿ]/.test(text)) return 'hi'
  return 'en'
}

// ---------- 2. Privacy gateway: mock PII detection + redaction ----------
// `group` = index of the capture group holding the PII (0 = whole match).
const PII_RULES = [
  { type: 'AADHAAR', re: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, group: 0 },
  { type: 'PHONE', re: /(?:\+91[\s-]?)?\b[6-9]\d{9}\b/g, group: 0 },
  { type: 'EMAIL', re: /[\w.+-]+@[\w-]+\.[\w.]+/g, group: 0 },
  { type: 'NAME', re: /\b(?:[Mm]y name is|[Nn]ame\s*:|I am|I'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/g, group: 1 },
  { type: 'NAME', re: /నా పేరు\s+([^\s,.!?]+(?:\s+[^\s,.!?]+)?)/g, group: 1 },
  { type: 'NAME', re: /मेरा नाम\s+([^\s,।!?]+(?:\s+(?!है)[^\s,।!?]+)?)/g, group: 1 },
]

export function redactPII(text) {
  const hits = []
  for (const rule of PII_RULES) {
    for (const m of text.matchAll(rule.re)) {
      const value = m[rule.group]
      const start = m.index + (rule.group ? m[0].lastIndexOf(value) : 0)
      hits.push({ type: rule.type, value, start, end: start + value.length })
    }
  }
  hits.sort((a, b) => a.start - b.start)

  // Drop overlaps, then split the text into plain / PII segments.
  const segments = []
  const entities = []
  let cursor = 0
  for (const h of hits) {
    if (h.start < cursor) continue
    if (h.start > cursor) segments.push({ text: text.slice(cursor, h.start) })
    segments.push({ text: h.value, type: h.type })
    entities.push({ type: h.type, value: h.value })
    cursor = h.end
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) })

  const redacted = segments.map((s) => (s.type ? `[${s.type}]` : s.text)).join('')
  return { segments, redacted, entities }
}

// ---------- 3. Context router (keyword scoring) ----------
export function routeQuery(text) {
  const q = text.toLowerCase()
  const abstain = responses.abstention
  if (abstain.patterns.some((p) => new RegExp(p, 'i').test(q))) {
    return { kind: 'abstain', intent: abstain }
  }
  let best = null
  let bestScore = 0
  for (const intent of responses.intents) {
    const score = intent.keywords.filter((k) => q.includes(k)).length
    if (score > bestScore) {
      best = intent
      bestScore = score
    }
  }
  return best ? { kind: 'answer', intent: best } : { kind: 'fallback', intent: responses.fallback }
}

// ---------- 4. Knowledge retrieval (static mock KB) ----------
const kbDoc = (id) => laws.documents.find((d) => d.id === id)

export function retrieve({ kind, intent }) {
  const matched = new Set(intent.sources || [])
  const sources = ['indiacode', 'cooperation', 'pmfby', 'myscheme', 'cpgrams'].map((id) => ({
    id,
    matched: matched.has(id),
  }))

  let checks
  if (kind === 'answer') {
    checks = [
      { key: 'ret.found', ok: true, sources: intent.sources },
      { key: 'ret.section', ok: true, detail: kbDoc(intent.kb)?.title },
      { key: 'ret.context', ok: true },
    ]
  } else if (kind === 'abstain') {
    checks = [
      { key: 'ret.found', ok: true, sources: intent.sources },
      { key: 'ret.byelawsMissing', ok: false, detail: kbDoc(intent.missing_kb)?.title },
      { key: 'ret.verifyFailed', ok: false },
    ]
  } else {
    checks = [{ key: 'ret.noneFound', ok: false }]
  }
  return { sources, checks }
}

// ---------- Full pipeline ----------
function localProcess(text) {
  const detectedLang = detectLanguage(text)
  const privacy = redactPII(text)
  // Routing only ever sees the redacted text — the "AI layer" never gets raw PII.
  const routed = routeQuery(privacy.redacted)
  return { detectedLang, privacy, ...routed, retrieval: retrieve(routed) }
}

export async function processQuery(text) {
  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (res.ok) return await res.json()
    } catch {
      // Backend unavailable: fall through to the local mock so the demo never breaks.
    }
  }
  return localProcess(text)
}
