import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse){
  const { goal } = req.body || {}
  const demo = [
    `What specific details make “${goal || 'your subject'}” look compelling?`,
    'What ambiance or context should the scene convey?',
    'Any constraints (length, tone, style, format) we must follow?',
    'What is the desired audience, and what action should they take?'
  ]
  res.json({ questions: demo })
}
