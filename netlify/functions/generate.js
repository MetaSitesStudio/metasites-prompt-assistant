import { GoogleGenAI } from "@google/genai";

export const handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return ok({}, 204);
    if (event.httpMethod !== "POST")   return err("Use POST", 405);

    const { prompt, model = "gemini-2.5-flash", system } = JSON.parse(event.body || "{}");
    if (!prompt) return err("Missing 'prompt'", 400);

    const ai = new GoogleGenAI(); // reads process.env.GEMINI_API_KEY
    const sys = system ?? "Refine the user's idea into ONE concise, high-quality prompt. Return ONLY the prompt text.";

    const result = await ai.models.generateContent({
      model,
      contents: [
        { role: "system", parts: [{ text: sys }] },
        { role: "user",   parts: [{ text: prompt }] }
      ]
    });

    const text = (result.text || "").trim();
    return ok({ prompt: text });
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
