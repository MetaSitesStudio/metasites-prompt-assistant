import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  const { goal, questions = [], answers = [] } = event.body ? JSON.parse(event.body) : {};
  const qa = (questions as string[])
    .map((q, i) => `- ${q}\n  ${answers[i] || ""}`)
    .join("\n");
  const prompt =
`Goal: ${goal}

Refinements:
${qa}

Create a polished, execution-ready prompt using the details above. Be concise, vivid, and unambiguous.`;
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  };
};
