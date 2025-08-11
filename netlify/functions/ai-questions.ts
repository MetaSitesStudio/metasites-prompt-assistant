// netlify/functions/ai-questions.ts
import type { Handler } from "@netlify/functions";

type Resp = {
  type: string;
  task: string; // alias of type for older callers
  language: string; // BCP-47 like "de", "en-US", "ja"
  questions: string[];
};

const MODEL = "gemini-1.5-flash";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return reply(405, { error: "Use POST" });
  }

  const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
  const body = event.body ? safeParse(event.body) : {};
  const goal: string = (body?.goal || "").toString().trim();

  if (!goal) return reply(400, { error: "Missing 'goal'" });

  // If no key, provide a decent local fallback (language strictly from goal)
  if (!API_KEY) {
    const lang = preferLang(goal);
    const { type, questions } = fallbackQuestions(goal, lang);
    return reply(200, {
      type,
      task: type,
      language: lang,
      questions,
    } as Resp);
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    // STRICT: detect language only from the goal text and mirror it
    const system = [
      "You are a world-class prompt engineer.",
      "Given the user's goal, you will:",
      "1) Detect the language of the goal (BCP-47 tag, e.g., 'de', 'en-US', 'ja') STRICTLY from the text itself.",
      "2) Classify the task into exactly one of:",
      "   email, essay, ad, social, script, image, code, research, product_copy, other.",
      "3) Write 6–8 SHORT, concrete, goal-aware follow-up questions.",
      "   • Mirror the user's language exactly.",
      "   • Reference specifics from the goal; avoid generic filler.",
      "   • Keep each question ≤ 140 characters.",
      "",
      "If the goal explicitly asks for another output language, follow that—otherwise mirror the input language.",
      "",
      "Return STRICT JSON only, no markdown, no commentary, matching this schema:",
      `{"language":"<bcp47>","type":"<task>","questions":["q1","q2","..."]}`,
    ].join("\n");

    const user = `USER_GOAL:\n${goal}\n`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: system + "\n\n" + user }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 700,
        // ask for structured JSON directly
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            language: { type: "string" },
            type: { type: "string" },
            questions: { type: "array", items: { type: "string" } },
          },
          required: ["language", "type", "questions"],
          additionalProperties: false,
        },
      },
      safetySettings: [
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      ],
    };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const j: any = await r.json();

    // With responseMimeType JSON, the model returns JSON text in parts[].text
    const text = extractText(j);
    if (!text) {
      const lang = preferLang(goal);
      const { type, questions } = fallbackQuestions(goal, lang);
      return reply(200, { type, task: type, language: lang, questions } as Resp);
    }

    // Some models still wrap JSON in fences; strip defensively
    const clean = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

    let parsed: any = safeParse(clean);
    if (!parsed?.questions || !Array.isArray(parsed.questions)) {
      // Try a second parse attempt if it returned a stringified JSON
      parsed = safeParse(String(clean));
    }

    if (!parsed?.questions || !Array.isArray(parsed.questions)) {
      const lang = preferLang(goal);
      const { type, questions } = fallbackQuestions(goal, lang);
      return reply(200, { type, task: type, language: lang, questions } as Resp);
    }

    const langFromModel =
      (String(parsed.language || "").toLowerCase() as string) || preferLang(goal);
    const typeFromModel = String(parsed.type || "other");

    // Clean questions
    const qs: string[] = parsed.questions
      .map((q: any) => String(q || "").trim())
      .filter((q: string) => q.length > 0)
      .slice(0, 8);

    return reply(200, {
      type: typeFromModel,
      task: typeFromModel,
      language: langFromModel,
      questions: qs,
    } as Resp);
  } catch (err: any) {
    console.error("ai-questions error:", err?.message || err);
    const lang = preferLang(goal);
    const { type, questions } = fallbackQuestions(goal, lang);
    return reply(200, { type, task: type, language: lang, questions } as Resp);
  }
};

/* ------------------ helpers ------------------ */

function reply(code: number, body: any) {
  return {
    statusCode: code,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function safeParse(t: any) {
  try {
    return JSON.parse(t);
  } catch (_) {
    return null;
  }
}

function extractText(j: any): string {
  const parts = j?.candidates?.[0]?.content?.parts;
  if (!parts) return "";
  const texts = parts.map((p: any) => p?.text).filter(Boolean);
  return texts.join("").trim();
}

// Strictly infer language from the goal text (no locale/timezone).
function preferLang(goal: string): string {
  const g = goal.toLowerCase();

  // quick heuristics
  if (/[äöüß]/.test(g) || /\b(und|oder|für|über|ein|kein|nicht|dass|weil|damit)\b/.test(g)) return "de";
  if (/\b(el|la|de|y|con|para|qué|por|una|un)\b/.test(g)) return "es";
  if (/\b(le|la|les|des|de|et|pour|que)\b/.test(g)) return "fr";
  if (/[ぁ-ゟ゠-ヿ一-龯]/.test(goal)) return "ja";
  if (/[а-яё]/i.test(goal)) return "ru";
  if (/[ąćęłńóśźż]/i.test(goal)) return "pl";
  if (/\b(ang|ng|sa|mga|ito|iyon|hindi|oo|mag|kayo|kami)\b/i.test(g)) return "tl"; // Tagalog hints
  if (/\b(ja|ei|olen|olet|hyvä|kiitos|mutta|että|myös|vain)\b/i.test(g)) return "fi"; // Finnish hints
  if (/\b(de|het|een|en|niet|met|voor|als|maar)\b/i.test(g)) return "nl";

  return "en";
}

function fallbackQuestions(goal: string, lang: string) {
  // Pick a type from simple keyword clues
  const g = goal.toLowerCase();
  let type = "other";
  if (/\bemail|e-mail|mail\b/.test(g)) type = "email";
  else if (/\bessay|aufsatz|paper\b/.test(g)) type = "essay";
  else if (/\bad\b|\bcampaign\b|\bkampagne\b|anzeigen/.test(g)) type = "ad";
  else if (/\bsocial|instagram|tiktok|facebook|twitter|x\b/.test(g)) type = "social";
  else if (/\bscript|skript|video\b/.test(g)) type = "script";
  else if (/\bimage|bild|prompt\b/.test(g)) type = "image";
  else if (/\bcode|funktion|script\b/.test(g)) type = "code";
  else if (/\bresearch|recherche|report\b/.test(g)) type = "research";
  else if (/\bproduct|beschreibung|copy\b/.test(g)) type = "product_copy";

  // Minimal multilingual templates, kept short
  const EN = [
    `What exact outcome do you want for “${goal}”?`,
    "Who is the audience (be specific)?",
    "Key angle or message to highlight?",
    "Tone and style to aim for?",
    "Must-include facts, sources, or claims?",
    "Length, format, or platform constraints?",
    "Deadline, CTA, or success metric?",
  ];

  const DE = [
    `Welches konkrete Ergebnis erwartest du für „${goal}“?`,
    "Wer ist die Zielgruppe (möglichst konkret)?",
    "Welcher Kernpunkt oder welche Botschaft steht im Fokus?",
    "Welcher Ton/Stil ist gewünscht?",
    "Welche Fakten, Quellen oder Claims müssen rein?",
    "Gibt es Längen-, Format- oder Plattformvorgaben?",
    "Gibt es Frist, Call-to-Action oder Erfolgskennzahl?",
  ];

  const ES = [
    `¿Qué resultado concreto buscas para “${goal}”?`,
    "¿Quién es la audiencia (sé específico)?",
    "¿Mensaje o ángulo principal?",
    "¿Tono y estilo deseados?",
    "¿Hechos, fuentes o requisitos obligatorios?",
    "¿Restricciones de longitud, formato o plataforma?",
    "¿Plazo, CTA o métrica de éxito?",
  ];

  const TL = [
    `Ano eksaktong resulta ang gusto mo para sa “${goal}”?`,
    "Sino ang tiyak na audience?",
    "Anong pangunahing mensahe o anggulo?",
    "Anong tono at istilo ang nais?",
    "May kailangang isamang facts o sources?",
    "Anong haba, format, o platform limits?",
    "May deadline, CTA, o sukatan ng tagumpay?",
  ];

  const FI = [
    `Mikä tarkka lopputulos halutaan aiheesta “${goal}”?`,
    "Kuka on kohdeyleisö (mahdollisimman täsmällisesti)?",
    "Mikä on keskeinen näkökulma tai viesti?",
    "Minkälainen sävy ja tyyli?",
    "Pakolliset faktat tai lähteet?",
    "Pituus-, formaatti- tai alustarajoitteet?",
    "Aikataulu, CTA tai onnistumismittari?",
  ];

  let questions = EN;
  if (lang.startsWith("de")) questions = DE;
  else if (lang.startsWith("es")) questions = ES;
  else if (lang.startsWith("tl")) questions = TL;
  else if (lang.startsWith("fi")) questions = FI;

  return { type, questions };
}
