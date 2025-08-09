import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse){
  const { goal, questions = [], answers = [] } = req.body || {}
  const qa = (questions as string[]).map((q, i) => `- ${q}\n  ${answers[i] || ''}`).join('\n')
  const prompt =
`Goal: ${goal}

Refinements:
${qa}

Create a polished, execution-ready prompt using the details above. Be concise, vivid, and unambiguous.`
  res.json({ prompt })
}
