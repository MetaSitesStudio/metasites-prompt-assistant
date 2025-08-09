import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  const body = event.body ? JSON.parse(event.body) : {};
  const goal = body.goal || "your subject";
  const demo = [
    `What specific details make “${goal}” look compelling?`,
    "What ambiance or context should the scene convey?",
    "Any constraints (length, tone, style, format) we must follow?",
    "What is the desired audience, and what action should they take?"
  ];
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questions: demo })
  };
};
