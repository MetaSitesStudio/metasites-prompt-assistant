// src/lib/generatePrompt.js

async function post(fn, payload) {
  // Use Netlify redirect: /api/* -> /.netlify/functions/*
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 45000); // 45s safety timeout

  try {
    const r = await fetch(`/api/${fn}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
      signal: ac.signal
    });
    const text = await r.text();
    if (!r.ok) {
      throw new Error(`${fn} failed: ${r.status} ${r.statusText} — ${text}`);
    }
    return text ? JSON.parse(text) : {};
  } finally {
    clearTimeout(t);
  }
}

/**
 * Generate package for the AppHome step:
 * - language is detected on the backend from the goal text
 * - NO timezone usage
 * - locale is optional hint only (you can omit if you want)
 */
export async function generatePackage(goal, opts = {}) {
  const cleanGoal = String(goal || '').trim();
  if (!cleanGoal) throw new Error('Goal is empty');

  // Only send goal; backend detects language from goal.
  // If you *want* to give a hint, uncomment the locale line below.
  const q = await post('ai-questions', {
    goal: cleanGoal,
    // locale: opts.locale || ''   // optional hint; safe to omit
  });

  const type = q.task || q.type || 'general';
  const language = q.language || 'en';
  const questions = Array.isArray(q.questions) ? q.questions : [];

  // Optional: a first-pass prompt (non-blocking)
  let initialPrompt = '';
  try {
    const g = await post('generate', { prompt: cleanGoal });
    initialPrompt = g.prompt || '';
  } catch {
    // ignore; we don't want to block the flow if /generate is down
  }

  return { prompt: initialPrompt, type, language, questions };
}
