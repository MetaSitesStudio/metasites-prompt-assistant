import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  const { prompt = "" } = event.body ? JSON.parse(event.body) : {};
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      variations: [
        `${prompt}\n\nVariation A: shorter, more imperative.`,
        `${prompt}\n\nVariation B: more descriptive, sensory details.`,
        `${prompt}\n\nVariation C: structured with bullets and constraints.`
      ]
    })
  };
};
