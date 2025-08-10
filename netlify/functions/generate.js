// High-signal Refinement + Task-aware follow-ups (Gemini REST)
// Backward-compatible response: { prompt } and adds: { type, questions }

const MODEL = "gemini-2.0-flash"; // fast + cheap

export const handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return ok({}, 204);
    if (event.httpMethod !== "POST") return err("Use POST", 405);

    const { prompt, model = MODEL } = JSON.parse(event.body || "{}");
    if (!prompt || typeof prompt !== "string") return err("Missing 'prompt'", 400);

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY;

    if (!apiKey) return err("Missing GEMINI API key in env", 500);

    // 1) Infer task type locally (fast heuristic). The model will verify/adjust.
    const inferred = inferType(prompt);

    // 2) Ask Gemini to (a) confirm task type, (b) produce task-specific followups, (c) produce a PRODUCTION-GRADE prompt
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const systemText = [
      "You are a world-class prompt engineer. Your job:",
      "1) Identify the user's task type precisely (email, essay, blog-post, ad-copy, YT-title, script, social-post, SEO, product-description, etc.).",
      "2) Generate 4–6 LASER-FOCUSED follow-up questions that are SPECIFIC to the task type. No generic creative-writing fluff.",
      "3) Produce ONE final, production-grade prompt that another model can execute directly.",
      "Rules:",
      "- The final prompt must be self-contained, explicit, and include all necessary constraints.",
      "- Use a compact, professional style. No markdown fences, no extra commentary.",
      "- Output JSON ONLY with keys: type, questions, prompt. No prose."
    ].join("\n");

    const userText = JSON.stringify({
      user_input: prompt,
      inferred_type: inferred,
      quality_bar: "senior copy chief / senior PM / staff prompt engineer",
      examples: taskExamples(),
    });

    const body = {
      system_instruction: { parts: [{ text: systemText }] },
      contents: [{ parts: [{ text: userText }] }],
      generationConfig: { temperature: 0.6, topK: 40, topP: 0.9, maxOutputTokens: 1200 }
    };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!r.ok) return err(`Upstream ${r.status}`, r.status);
    const data = await r.json();

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let parsed = safeParseJSON(raw);

    // Fallback if model returns text instead of strict JSON
    if (!parsed || !parsed.prompt) {
      parsed = {
        type: inferred || "general",
        questions: defaultQuestions(inferred),
        prompt: hardenFallbackPrompt(prompt, inferred)
      };
    }

    // Backward compat: always return { prompt }, plus richer fields
    return ok({
      prompt: String(parsed.prompt || "").trim(),
      type: String(parsed.type || inferred || "general"),
      questions: Array.isArray(parsed.questions) ? parsed.questions.slice(0, 6) : []
    });

  } catch (e) {
    return err(String(e), 500);
  }
};

/* ---------------- helpers ---------------- */

function ok(body, code = 200) {
  return {
    statusCode: code,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  };
}
const err = (msg, code = 500) => ok({ error: msg }, code);

function inferType(text) {
  const t = text.toLowerCase();
  if (/\byou ?tube\b|\byt\b|title|thumbnail|hook/.test(t)) return "youtube-title";
  if (/\bsubject\b|\bemail\b|newsletter|cold[- ]?email|outreach/.test(t)) return "email";
  if (/\bessay\b|thesis|paper|analysis|argumentative/.test(t)) return "essay";
  if (/\bblog\b|article|post|long[- ]?form/.test(t)) return "blog-post";
  if (/\bheadline\b|ad[- ]?copy|facebook ads|google ads|cta\b/.test(t)) return "ad-copy";
  if (/\bscript\b|video script|voiceover|scene/.test(t)) return "script";
  if (/\bproduct\b.*\bdescription\b|\bshopify\b|\bamazon\b/.test(t)) return "product-description";
  if (/\bseo\b|keywords|meta description|search intent/.test(t)) return "seo";
  return "general";
}

function defaultQuestions(type) {
  const Q = {
    "email": [
      "Who is the audience (new leads, existing customers, lapsed buyers)?",
      "Primary objective (announce, convert trial, book a call)?",
      "Offer or incentive (discount %, bonus, deadline)?",
      "Tone (professional, friendly, urgent, witty)?",
      "Constraints (word count, brand voice rules, compliance)?"
    ],
    "essay": [
      "Intended audience and tone (academic, public, reflective)?",
      "Specific themes or angles to cover?",
      "Target length and format?",
      "Key message or takeaway?",
      "Sources or references required?"
    ],
    "youtube-title": [
      "Exact topic or angle to highlight?",
      "Target viewer (beginner, enthusiast, expert)?",
      "Tone (curious, bold, educational, dramatic)?",
      "Any keywords or tribal names that must appear?",
      "Do you want a numbered list of options (how many)?"
    ],
    "ad-copy": [
      "Product and core benefit?",
      "Target segment and pain point?",
      "Offer (discount, free trial, guarantee) with deadline?",
      "Platform (FB, Google, X) and character limits?",
      "Desired CTA (Buy now, Learn more, Sign up)?"
    ],
    "blog-post": [
      "Audience and search intent?",
      "Outline depth (H2/H3) and target word count?",
      "Primary keyword(s) and competitor you must beat?",
      "Examples/resources to cite?",
      "Call to action at the end?"
    ],
    "script": [
      "Runtime and platform (YT short, long-form, TikTok)?",
      "Structure (hook, beats, CTA) and narrator style?",
      "Footage types (A-roll, B-roll, archival)?",
      "Must-include facts or lines?",
      "Monologue vs dialog?"
    ],
    "product-description": [
      "Audience and use case?",
      "Top 3 features → benefits mapping?",
      "Brand voice (premium, playful, technical)?",
      "Where it appears (Amazon, PDP, catalog) + limits?",
      "Any compliance or claims to avoid?"
    ],
    "seo": [
      "Primary keyword and region?",
      "Search intent (informational, commercial, transactional)?",
      "Competing pages you want to outrank?",
      "Preferred H2/H3 structure?",
      "Internal links or products to feature?"
    ],
    "general": [
      "Define the audience precisely.",
      "What outcome do you want from the reader/viewer?",
      "Tone/style and any brand voice rules?",
      "Hard constraints (length, format, platform limits)?",
      "Facts, examples, or references to include?"
    ]
  };
  return Q[type] || Q["general"];
}

function hardenFallbackPrompt(idea, type) {
  const templates = {
    "email": `Write a persuasive email to [AUDIENCE] that achieves [OBJECTIVE].
Include: 1) attention-grabbing subject (3 options), 2) concise body (120–180 words) that highlights [BENEFIT] and addresses [PAIN], 3) clear CTA [CTA] and deadline [DEADLINE], 4) tone [TONE].
Constraints: align with brand voice [VOICE], avoid spammy phrasing, use short paragraphs and scannable bullets.
Return JSON: { "subject_options": [...], "email_body": "..." }`,
    "essay": `Write an essay for [AUDIENCE] on “[TOPIC]”.
Length: ~1200 words, sections with H2s, balanced analysis, cite [SOURCES] where needed.
End with a concise conclusion and open question.`,
    "youtube-title": `Generate 12 clickworthy YouTube titles for “[TOPIC]” targeted at [VIEWER].
Mix curiosity + clarity; keep 55–65 chars; include keywords: [KEYWORDS].
Return as a numbered list.`,
    "ad-copy": `Write 5 ad headlines (30 chars) and 5 descriptions (90 chars) for [PLATFORM] promoting [PRODUCT] to [AUDIENCE].
Focus on [BENEFIT], include offer [OFFER] with [DEADLINE], and a clear CTA [CTA].`,
    "blog-post": `Draft a detailed outline + intro for a blog post on “[TOPIC]” (target 1800 words).
Audience: [AUDIENCE]. Include H2/H3s, FAQs, and internal CTA [CTA].`,
    "script": `Write a 60–90s video script on “[TOPIC]” for [PLATFORM].
Structure: cold open hook (under 6s), 3 beats, CTA. Notes for B-roll and captions.`,
    "product-description": `Write a product description for [PRODUCT] targeting [AUDIENCE].
Use features→benefits mapping, 120–160 words, scannable bullets, compliant language [RULES].`,
    "seo": `Create an SEO brief for “[TOPIC]” targeting [REGION] with primary keyword “[KEYWORD]”.
Include: SERP intent, title tag (<60), meta description (<155), H2/H3 outline, internal links.`
  };
  const base = templates[type] || `Rewrite the user's idea into a precise, executable prompt with explicit audience, outcome, tone, constraints, and format.`;
  return base.replace(/\s+/g, " ").trim();
}

function taskExamples() {
  return {
    email: {
      input: "write a persuasive email inviting customers to try our new product",
      prompt: hardenFallbackPrompt("", "email")
    },
    essay: {
      input: "create an essay about the Mangyan tribes in Mindoro",
      prompt: hardenFallbackPrompt("", "essay")
    },
    youtubeTitle: {
      input: "YouTube title about Amazon tribes",
      prompt: hardenFallbackPrompt("", "youtube-title")
    }
  };
}

function safeParseJSON(s) {
  try {
    return JSON.parse(s);
  } catch {
    // Attempt to extract a JSON block if the model wrapped it with prose
    const m = s.match(/\{[\s\S]*\}$/);
    if (m) {
      try { return JSON.parse(m[0]); } catch { return null; }
    }
    return null;
  }
}
