// Returns full package from the Netlify function: { prompt, type, questions }
export async function generatePackage(idea) {
  const res = await fetch("/.netlify/functions/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: idea })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Back-compat (some places only expect { prompt })
export async function generatePrompt(idea) {
  const data = await generatePackage(idea);
  return { prompt: data.prompt };
}
