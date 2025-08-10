// netlify/functions/ai-enhance.ts
// Builds a production-grade prompt (no [PLACEHOLDERS]) and returns { type, title, prompt }

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Use POST' };
  }

  const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
  if (!API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing GOOGLE_GEMINI_API_KEY' }) };
  }

  try {
    const { goal = '', answers = [], extra = {} } = JSON.parse(event.body || '{}');

    const answersBlock = (answers as string[])
      .map((a, i) => `A${i + 1}: ${a}`)
      .join('\n');

    const instruction = `
You are an expert Prompt Engineer. Given a user's goal and brief answers,
produce a single, execution-ready prompt that another AI can run directly.

1) First infer a task TYPE from: email | essay | ad | social | script | image | general.
2) Then compose a polished prompt with these sections (concise, no placeholders):
   - Role: (who the model should be)
   - Task: (what to produce)
   - Inputs: (facts gleaned from the answers; synthesize sensible defaults)
   - Constraints: (style, tone, length/structure, do/don't)
   - Output format: (bullets/sections/JSON schema as appropriate)
   - Quality bar: (clarity, specificity, correctness)

Rules:
- Do NOT use bracket placeholders like [AUDIENCE]; fill fields from answers or safe defaults.
- Avoid meta language. Write it like instructions to a model.
- 400–700 words depending on TYPE.
- Return pure JSON only with keys:
  {
    "type": "<inferred type>",
    "title": "<one-line title>",
    "final_prompt": "<the full prompt, multiline>"
  }
`.trim();

    const userContext = `
GOAL:
${goal || '(none)'}

ANSWERS:
${answersBlock || '(none)'}
`.trim();

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const payload = {
      contents: [
        { role: 'user', parts: [{ text: instruction }] },
        { role: 'user', parts: [{ text: userContext }] }
      ],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1200
      }
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const j: any = await r.json();

    const text: string =
      j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ||
      j?.candidates?.[0]?.content?.parts?.[0]?.text ||
      '';

    const cleaned = text.trim()
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/, '');

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        type: 'general',
        title: 'Enhanced Prompt',
        final_prompt: cleaned || 'Prompt generation failed.'
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        type: parsed.type || 'general',
        title: parsed.title || 'Enhanced Prompt',
        prompt: parsed.final_prompt || parsed.prompt || ''
      })
    };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};
