import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  const { prompt = "" } = event.body ? JSON.parse(event.body) : {};
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      preview: `Preview based on your prompt:\n\n${prompt}\n\n(Real AI output will appear here once Gemini is connected.)`
    })
  };
};
