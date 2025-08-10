// netlify/functions/ai-variations.ts
import type { Handler } from "@netlify/functions"

type Body = {
  prompt?: string        // finaler Prompt (bevorzugt)
  goal?: string          // falls noch kein finaler Prompt existiert
  type?: string          // email | essay | ad | social | script | image | code | research | product_copy | other
  language?: string      // BCP-47, z.B. "de", "en-US"
  count?: number         // gewünschte Anzahl
}

type Resp = { variants: string[]; language?: string }

const MODEL = "gemini-1.5-flash"

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return reply(405, { error: "Use POST" })

  const API_KEY = process.env.GOOGLE_GEMINI_API_KEY
  const body: Body = event.body ? safeParse(event.body) || {} : {}

  const basePrompt = (body.prompt || "").toString().trim()
  const goal = (body.goal || "").toString().trim()
  const type = (body.type || "other").toString()
  const langHint = (body.language || "").toString().toLowerCase()
  const n = clampInt(body.count, 5, 3, 8)

  if (!basePrompt && !goal) return reply(400, { error: "Missing 'prompt' or 'goal'" })

  const lang = langHint || preferLangFromText(basePrompt || goal) || "en"

  if (!API_KEY) {
    return reply(200, { variants: fallbackVariants(basePrompt || goal, type, lang), language: lang })
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`

    const instructions =
`You are an expert prompt engineer.
TASK: Create ${n} distinct VARIATIONS of the user's prompt (not the final output), keeping intent the same but angle/style different.
LANGUAGE: ${lang} (mirror exactly; do not switch languages).
EACH VARIATION: concise, executable, one paragraph max. No examples unless asked.
RETURN STRICT JSON ONLY:
{"variants": ["v1","v2", "..."]}`

    const context =
`TYPE: ${type}
BASE_PROMPT:
${basePrompt || "(derived from goal)"}

GOAL (if helpful):
${goal || "(n/a)"}
`

    const payload = {
      contents: [{ role: "user", parts: [{ text: instructions + "\n\n" + context }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 800 },
      safetySettings: [
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" }
      ]
    }

    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    const j: any = await r.json()

    const text = extractText(j)
    if (!text) return reply(200, { variants: fallbackVariants(basePrompt || goal, type, lang), language: lang })

    const clean = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim()
    const parsed = safeParse(clean) || safeParse(String(clean))
    const variants: string[] =
      (parsed?.variants || []).map((v: any) => String(v || "").trim()).filter(Boolean).slice(0, n)

    if (!variants.length) return reply(200, { variants: fallbackVariants(basePrompt || goal, type, lang), language: lang })
    return reply(200, { variants, language: lang })
  } catch {
    return reply(200, { variants: fallbackVariants(basePrompt || goal, type, lang), language: lang })
  }
}

/* --------------- helpers --------------- */

function reply(code: number, body: any) {
  return { statusCode: code, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
}
function safeParse(t: any) { try { return JSON.parse(t) } catch { return null } }
function extractText(j: any): string {
  const parts = j?.candidates?.[0]?.content?.parts
  if (!parts) return ""; return parts.map((p: any) => p?.text).filter(Boolean).join("").trim()
}
function clampInt(v: any, def: number, min: number, max: number) {
  const n = parseInt(v as any, 10); if (Number.isNaN(n)) return def; return Math.max(min, Math.min(max, n))
}

// leichte Heuristik wie bei questions/enhance
function preferLangFromText(text: string): string {
  const g = text.toLowerCase()
  if (/[äöüß]/.test(g) || /\b(und|oder|für|über|ein|kein|nicht|dass|weil|damit)\b/.test(g)) return "de"
  if (/\b(el|la|de|y|con|para|qué|por|una|un)\b/.test(g)) return "es"
  if (/\b(le|la|les|des|de|et|pour|que)\b/.test(g)) return "fr"
  if (/[ぁ-ゟ゠-ヿ一-龯]/.test(text)) return "ja"
  if (/[а-яё]/i.test(text)) return "ru"
  if (/[ąćęłńóśźż]/i.test(text)) return "pl"
  return "en"
}

function fallbackVariants(base: string, type: string, lang: string): string[] {
  const angles_en = [
    "benefit-driven", "data-driven", "storytelling", "urgent/limited-time", "authority/expert", "problem-solution"
  ]
  const angles_de = [
    "nutzenorientiert", "datenbasiert", "Storytelling", "dringend/limitiert", "Autorität/Expertise", "Problem-Lösung"
  ]
  const angles = lang.startsWith("de") ? angles_de : angles_en
  return angles.slice(0,5).map(a =>
    lang.startsWith("de")
      ? `Variante (${a}): ${base}`
      : `Variation (${a}): ${base}`
  )
}
