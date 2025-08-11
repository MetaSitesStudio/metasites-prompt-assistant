// netlify/functions/ai-enhance.ts
import type { Handler } from "@netlify/functions"

type Body = {
  goal?: string
  type?: string
  answers?: string[] | Record<string, string>
  language?: string // BCP-47 (e.g. "de", "en-US")
}

type Resp = { prompt: string; type?: string; language?: string }

const MODEL = "gemini-1.5-flash"

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return reply(405, { error: "Use POST" })

  const API_KEY = process.env.GOOGLE_GEMINI_API_KEY
  const body: Body = event.body ? safeParse(event.body) || {} : {}
  const goal = (body.goal || "").toString().trim()
  const langHint = (body.language || "").toString().toLowerCase()
  const taskType = (body.type || "other").toString()
  const answers = normalizeAnswers(body.answers)

  if (!goal) return reply(400, { error: "Missing 'goal'" })

  // Sprache priorisieren: explicit > heuristik
  const lang = langHint || preferLangFromText(goal) || "en"

  if (!API_KEY) {
    const prompt = fallbackEnhancedPrompt(goal, answers, taskType, lang)
    return reply(200, { prompt, type: taskType, language: lang })
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`

    const instructions =
`You are an expert prompt engineer.
TASK: Turn the user's goal and answers into ONE high-quality, execution-ready prompt.
LANGUAGE: ${lang} (mirror exactly; do not switch languages).
STYLE: Precise, concise, runnable anywhere (ChatGPT, Gemini, Claude, etc.).
INCLUDE: objective, audience, constraints, tone, format, success criteria.
DO NOT: add examples unless asked, no markdown fences.

Return STRICT JSON only:
{"prompt":"...","type":"${taskType}","language":"${lang}"}
`

    const context =
`USER_GOAL:
${goal}

USER_ANSWERS:
${answers.length ? answers.map((a,i)=>`${i+1}. ${a}`).join("\n") : "(none provided)"}
`

    const payload = {
      contents: [{ role: "user", parts: [{ text: instructions + "\n" + context }] }],
      generationConfig: { temperature: 0.25, maxOutputTokens: 800 },
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
    if (!text) {
      const prompt = fallbackEnhancedPrompt(goal, answers, taskType, lang)
      return reply(200, { prompt, type: taskType, language: lang })
    }

    const clean = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim()
    const parsed = safeParse(clean) || safeParse(String(clean))
    const prompt = parsed?.prompt ? String(parsed.prompt) : fallbackEnhancedPrompt(goal, answers, taskType, lang)

    return reply(200, { prompt, type: taskType, language: lang })
  } catch (_) {
    const prompt = fallbackEnhancedPrompt(goal, answers, taskType, lang)
    return reply(200, { prompt, type: taskType, language: lang })
  }
}

/* ---------------- helpers ---------------- */

function reply(code: number, body: any) {
  return { statusCode: code, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
}

function safeParse(t: any) {
  try { return JSON.parse(t) } catch { return null }
}

function extractText(j: any): string {
  const parts = j?.candidates?.[0]?.content?.parts
  if (!parts) return ""
  const texts = parts.map((p: any) => p?.text).filter(Boolean)
  return texts.join("").trim()
}

function normalizeAnswers(a: Body["answers"]): string[] {
  if (!a) return []
  if (Array.isArray(a)) return a.map(x => String(x || "").trim()).filter(Boolean)
  return Object.values(a).map(x => String(x || "").trim()).filter(Boolean)
}

// super-leichtgewichtige Heuristik wie bei ai-questions
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

function fallbackEnhancedPrompt(goal: string, answers: string[], type: string, lang: string): string {
  const A = answers.length ? `\nAntworten:\n- ${answers.join("\n- ")}` : ""
  if (lang.startsWith("de")) {
    return `Erstelle einen ausführbaren Prompt auf Deutsch für die Aufgabe: "${goal}".
Ziel: klares Ergebnis, Zielgruppe, Ton, Format, Constraints, Erfolgsmaß.
Keine Code-Fences, keine Beispiele.${A ? A : ""}`
  }
  return `Create a runnable prompt in English for: "${goal}".
Include objective, audience, tone, format, constraints, success metric.
No code fences, no examples.${A ? A : ""}`
}
