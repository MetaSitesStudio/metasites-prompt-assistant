// netlify/functions/ai-testdrive.ts
// Produces a short, useful preview from the final prompt.

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Use POST' };
  }

  const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
  if (!API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing GOOGLE_GEMINI_API_KEY' }) };
  }

  try {
    const { prompt = '', type = 'general' } = JSON.parse(event.body || '{}');
    if (!prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing prompt' }) };
    }

    const previewAsk =
      ({
        email: 'Generate 3 subject lines and a 140–180 word email body. Respond in plain text only.',
        essay: 'Produce an outline (5–7 H2s) and the first 2 paragraphs (<=220 words total). Respond in plain text only.',
        ad: 'Give 3 hooks (<=12 words each) and platform copy for IG + YT Short (<=80 words each). Respond in plain text only.',
        social: 'Give 3 posts (<=80 words each) with distinct angles. Respond in plain text only.',
        script: 'Give a 6-beat outline and the opening 15–25 seconds of script. Respond in plain text only.',
        image: 'Produce one fully-specified image prompt and 2 alternates, one line each. Plain text only.',
        general: 'Give a concise preview (<=200 words) that shows the output style. Plain text only.'
      } as Record<string, string>)[type] || 'Give a concise preview (<=200 words). Plain text only.';

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text:
                `You will generate a SAFE, respectful, neutral preview of the final output.\n` +
                `Return PLAIN TEXT only (no markdown, no code fences).\n\n` +
                `FINAL PROMPT:\n${prompt}\n\nTASK FOR PREVIEW:\n${previewAsk}`
            }
          ]
        }
      ],
      generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
      // Reduce over-blocking while keeping safety
      safetySettings: [
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }
      ]
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const j: any = await r.json();

    // If blocked or empty, return a note so the UI doesn't look "dead"
    if (!j?.candidates?.length) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          sample: '',
          note: j?.promptFeedback?.blockReason ? `Preview blocked: ${j.promptFeedback.blockReason}` : 'No preview returned.',
          debug: j?.promptFeedback || null
        })
      };
    }

    const parts = j.candidates[0]?.content?.parts || [];
    const texts = parts.map((p: any) => p?.text).filter(Boolean);
    const sample = texts.join('').trim();

    return { statusCode: 200, body: JSON.stringify({ sample }) };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};
