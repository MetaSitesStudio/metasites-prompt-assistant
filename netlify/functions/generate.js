export const handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return ok({}, 204);
    if (event.httpMethod !== "POST")   return err("Use POST", 405);

    const { prompt, model = "gemini-2.0-flash" } = JSON.parse(event.body || "{}");
    if (!prompt) return err("Missing 'prompt'", 400);

    const apiKey = process.env.GEMINI_API_KEY
      || process.env.GOOGLE_GEMINI_API_KEY
      || process.env.GOOGLE_API_KEY;
    if (!apiKey) return err("Missing GEMINI API key in env", 500);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const systemText =
      "You refine rough ideas into ONE concise, high-quality prompt. " +
      "Output EXACTLY one line of plain text. No code blocks, no quotes, no markdown, no explanations.";

    const body = {
      system_instruction: { parts: [{ text: systemText }] },
      contents: [{ parts: [{ text: prompt }] }]
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) return err(`Upstream ${res.status}`, res.status);

    const data = await res.json();
    const text =
      (data.candidates?.[0]?.content?.parts?.[0]?.text || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 800);

    return ok({ prompt: text || "" });
  } catch (e) {
    return err(String(e), 500);
  }
};

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const ok  = (body, code=200) => ({ statusCode: code, headers, body: JSON.stringify(body) });
const err = (msg, code=500)   => ok({ error: msg }, code);
