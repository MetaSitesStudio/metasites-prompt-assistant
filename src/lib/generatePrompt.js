export async function generatePrompt(idea) {
  const res = await fetch("/.netlify/functions/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: idea })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json(); // { prompt: "..." }
}
