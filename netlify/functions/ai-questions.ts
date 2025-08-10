// netlify/functions/ai-questions.ts
// Dynamic, language-agnostic clarifying questions.
// - Mirrors the user's input language (no hard-coded de/en)
// - Classifies task from the goal
// - Returns exactly 6 sharp questions from Gemini
// - Robust local fallback if API fails

type Task = 'essay' | 'ad' | 'email' | 'social' | 'script' | 'image' | 'general';

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Use POST' };

  try {
    const { goal = '' } = JSON.parse(event.body || '{}');
    const cleanGoal = String(goal || '').trim();
    if (!cleanGoal) {
      return json({ task: 'general', language: 'und', questions: ['Please describe your goal in one sentence.'] });
    }

    const task = classifyTask(cleanGoal);
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (apiKey) {
      const ai = await askGeminiForQuestions(apiKey, cleanGoal, task);
      if (ai.ok && ai.questions && ai.questions.length >= 6) {
        return json({ task, language: ai.language || 'und', questions: ai.questions.slice(0, 6) });
      }
    }

    // Local fallback (English/German tuned; otherwise generic EN)
    const { language, questions } = localFallback(cleanGoal, task);
    return json({ task, language, questions });
  } catch (err: any) {
    return json({
      task: 'general',
      language: 'und',
      questions: ['Please describe your goal concisely and mention audience, format, tone, constraints, and deadline.']
    });
  }
};

/* ---------------- helpers ---------------- */

function json(obj: any) {
  return { statusCode: 200, body: JSON.stringify(obj) };
}

function classifyTask(text: string): Task {
  const t = text.toLowerCase();

  const hit = (arr: string[]) => arr.some(w => t.includes(w));
  if (hit(['essay', 'aufsatz', 'essai', 'ensayo', 'saggio', 'aufsatz schreiben'])) return 'essay';
  if (hit(['campaign', 'kampagne', 'campaña', 'campagne', 'ad', 'anzeige', 'facebook ads', 'social media ad'])) return 'ad';
  if (hit(['email', 'e-mail', 'newsletter', 'correo'])) return 'email';
  if (hit(['social media', 'tweet', 'post', 'instagram', 'linkedin', 'tiktok'])) return 'social';
  if (hit(['script', 'skript', 'guion', 'video', 'short'])) return 'script';
  if (hit(['image prompt', 'bild prompt', 'midjourney', 'stable diffusion', 'dalle'])) return 'image';
  return 'general';
}

function subjectFromGoal(goal: string) {
  const q = goal.match(/["“](.+?)["”]/);
  if (q) return q[1];
  const words = goal.split(/\s+/).slice(-8);
  return words.join(' ');
}

/* -------- local fallback (minimal but useful) -------- */

function detectSimpleLang(text: string): 'de' | 'en' | 'und' {
  const t = text.toLowerCase();
  const hasUmlaut = /[äöüß]/.test(t);
  const deWords = ['aufsatz', 'kampagne', 'anzeige', 'über', 'für', 'schreibe', 'stämme', 'mindoro'];
  if (hasUmlaut || deWords.some(w => t.includes(w))) return 'de';
  const enWords = ['essay', 'campaign', 'email', 'script', 'image prompt', 'social media'];
  if (enWords.some(w => t.includes(w))) return 'en';
  return 'und';
}

function localFallback(goal: string, task: Task): { language: string; questions: string[] } {
  const lang = detectSimpleLang(goal);
  const topic = subjectFromGoal(goal);

  const de = {
    essay: [
      `Wer ist die Zielgruppe und welcher Ton ist gewünscht (z. B. Klasse, akademisch, neutral)?`,
      `Welche Aspekte zu „${topic}“ sollen behandelt werden (Geschichte, Gegenwart, Zukunft, Kultur, Herausforderungen)?`,
      `Gewünschte Länge und Struktur (z. B. 800–1200 Wörter, H2-Zwischenüberschriften, Zitate)?`,
      `Quellenanforderungen (Anzahl/Art) und Zitierstil (APA/MLA/Chicago)?`,
      `Zentrale These/Fragestellung, die klar herausgearbeitet werden soll?`,
      `Gibt es Inhalte, die vermieden werden sollen (Do-not-list, sensible Punkte)?`
    ],
    ad: [
      `Wer genau ist die Zielgruppe (Segment/Alter/Interessen) für „${topic}“?`,
      `Welche Kernbotschaft/USP oder welches Angebot steht im Vordergrund (Beweis/Sozialbeleg)?`,
      `Welche Kanäle/Formate (IG Reels, TikTok, YT Shorts, statisch/Video) und grobe Laufzeit/Budget?`,
      `Ton & Bildsprache (freundlich, frech, premium, lokal, nachhaltig)?`,
      `Konkrete CTA und ggf. Frist/Limitierung?`,
      `Gibt es Beispiele/Vorbilder oder Inhalte, die wir vermeiden sollen?`
    ],
    email: [
      `An wen richtet sich die E-Mail (Neukunden, Bestandskunden, inaktiv)?`,
      `Hauptziel (Ankündigung, Testphase, Termin buchen) und Erfolgskennzahl?`,
      `Angebot/Benefit (Rabatt/Bonus/Testdauer) inkl. Bedingungen/Deadline?`,
      `Ton & Markenrichtlinien (Wörter/Claims vermeiden/verwenden)?`,
      `Betreffzeilen-Stil (3 Varianten?) und gewünschte Länge des Textes?`,
      `Gibt es rechtliche/Compliance-Vorgaben?`
    ],
    social: [
      `Welche Plattformen & Zielgruppen stehen im Fokus?`,
      `Kernbotschaft/Story zu „${topic}“, die hängen bleiben soll?`,
      `Hashtags/Keywords (nutzen/vermeiden)?`,
      `Ton & Format (knapp, witzig, informativ; Emojis ja/nein)?`,
      `CTA/Link & Posting-Kadenz?`,
      `Beispiele, die gefallen bzw. No-Gos?`
    ],
    script: [
      `Plattform & Länge (IG Reel/Short 20–30 s, YouTube 60–120 s)?`,
      `Kern-Hook zu „${topic}“ und gewünschter Spannungsbogen?`,
      `Vorhandene Assets (A-Roll, B-Roll, Screens, B-Roll-Themen)?`,
      `Ton & Stil (dokumentarisch, humorvoll, dynamisch, seriös)?`,
      `CTA/Schlussbotschaft und gewünschte nächste Aktion?`,
      `Gibt es rechtliche/Marken-Einschränkungen?`
    ],
    image: [
      `Welches Motiv/Setting zu „${topic}“?`,
      `Welcher Stil (Foto, Aquarell, Doodle, 3D, Isometrie, Filmstill)?`,
      `Komposition/Objektiv/Beleuchtung (nah/weit, 35 mm, Golden Hour)?`,
      `Farbwelt & Stimmung (hell, moody, lebhaft, monochrom)?`,
      `Auflösung/Seitenverhältnis/Negative Prompts?`,
      `Referenzen, die dir gefallen (und warum)?`
    ],
    general: [
      `Was ist das konkrete Ziel?`,
      `Wer ist das Publikum?`,
      `Welche Anforderungen/Einschränkungen (Länge, Stil, Frist)?`,
      `Beispiele/Referenzen?`,
      `Wie misst du Erfolg (KPI)?`,
      `Was soll ausdrücklich vermieden werden?`
    ]
  };

  const en = {
    essay: [
      `Who is the audience and what tone is preferred (grade level, academic, neutral)?`,
      `Which angles about “${topic}” should be covered (history, present, future, culture, challenges)?`,
      `Target length and structure (e.g., 800–1200 words, H2 sections, citations)?`,
      `Source requirements (count/type) and citation style (APA/MLA/Chicago)?`,
      `What central thesis/research question should be emphasized?`,
      `Any “do-not” items or sensitive areas to avoid?`
    ],
    ad: [
      `Who exactly is the target audience for “${topic}” (segment/age/interests)?`,
      `What core message/USP or offer leads (proof/social proof)?`,
      `Which channels/formats (IG Reels, TikTok, YT Shorts, static/video) and rough budget/timeline?`,
      `Tone & visuals (friendly, bold, premium, local, sustainable)?`,
      `Primary CTA and any deadline/limit?`,
      `Any examples to emulate—or competitors/angles to avoid?`
    ],
    email: [
      `Who is the audience (new leads, existing, lapsed)?`,
      `Primary objective (announce, convert trial, book a call) and success metric?`,
      `Offer/benefit (discount %, bonus, trial length) incl. terms/deadline?`,
      `Tone & brand rules (must-use/avoid words)?`,
      `Subject line style (3 options?) and body length target?`,
      `Any legal/compliance constraints?`
    ],
    social: [
      `Which platforms & audiences are in scope?`,
      `What key message/story about “${topic}” should stick?`,
      `Any hashtags/keywords to include or avoid?`,
      `Tone & format (punchy, witty, informative; emojis yes/no)?`,
      `CTA/links & posting cadence?`,
      `Examples you like vs. no-gos?`
    ],
    script: [
      `Platform & duration (IG Reel/Short 20–30s, YouTube 60–120s)?`,
      `Core hook for “${topic}” and desired narrative beat?`,
      `Available assets (A-roll, B-roll, screens)?`,
      `Tone & style (documentary, humorous, snappy, formal)?`,
      `Closing CTA and next step?`,
      `Any brand/legal constraints?`
    ],
    image: [
      `What subject/setting around “${topic}” do you want?`,
      `Which style (photo, watercolor, doodle, 3D, isometric, film still)?`,
      `Composition/lens/lighting (close/wide, 35mm, golden hour)?`,
      `Color mood & palette (bright, moody, vibrant, monochrome)?`,
      `Resolution/aspect ratio/negative prompts?`,
      `References you like (and why)?`
    ],
    general: [
      `What’s the concrete objective?`,
      `Who is the audience?`,
      `Any constraints/requirements (length, style, deadline)?`,
      `Examples/references?`,
      `How will success be measured (KPI)?`,
      `What should be explicitly avoided?`
    ]
  };

  if (lang === 'de') return { language: 'de', questions: (de as any)[task] || de.general };
  if (lang === 'en') return { language: 'en', questions: (en as any)[task] || en.general };
  return { language: 'en', questions: (en as any)[task] || en.general };
}

/* -------------- Gemini -------------- */

async function askGeminiForQuestions(
  apiKey: string,
  goal: string,
  task: Task
): Promise<{ ok: boolean; language?: string; questions?: string[] }> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const taskLabel = {
      essay: 'essay',
      ad: 'advertising campaign',
      email: 'email',
      social: 'social media posts',
      script: 'short-form video script',
      image: 'image prompt',
      general: 'general task'
    }[task];

    const prompt = `
Write your entire response in the SAME LANGUAGE as GOAL. Do NOT translate.
Return STRICT JSON only, with this schema:
{
  "language": "<ISO 639-1 code if obvious, else a language name>",
  "questions": ["<q1>", "<q2>", "<q3>", "<q4>", "<q5>", "<q6>"]
}

ROLE: Precise prompt strategist.
TASK: Ask exactly 6 sharp, non-redundant follow-up questions that enable building a high-quality ${taskLabel} prompt.
STYLE: No numbering, no preface, no explanations. The strings must be just the questions.
CONTENT: Make each question specific to the GOAL (audience, format/length, tone/voice, channels, CTA, sources, deadlines, constraints, anti-requirements).

GOAL:
${goal}
`;

    const payload: any = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.25,
        topP: 0.9,
        maxOutputTokens: 320,
        // Some runtimes accept this; if ignored, we'll still parse JSON from text
        response_mime_type: 'application/json'
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }
      ]
    };

    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const j: any = await r.json();

    const raw =
      j?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p?.text)
        .filter(Boolean)
        .join('\n')
        ?.trim() || '';

    const cleaned = raw.replace(/```(?:json)?/g, '').trim();
    let obj: any;
    try {
      obj = JSON.parse(cleaned);
    } catch {
      // fallback: treat as plain lines if model ignored JSON instruction
      const lines = cleaned
        .split(/\r?\n+/)
        .map((s: string) => s.replace(/^\s*[-•\d.)]+\s*/, '').trim())
        .filter(Boolean);
      if (lines.length >= 6) return { ok: true, language: 'und', questions: lines.slice(0, 6) };
      return { ok: false };
    }

    if (Array.isArray(obj?.questions) && obj.questions.length >= 6) {
      return { ok: true, language: String(obj.language || 'und'), questions: obj.questions.slice(0, 6) };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}
