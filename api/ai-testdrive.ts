import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse){
  const { prompt = '' } = req.body || {}
  res.json({
    preview: `Preview based on your prompt:\n\n${prompt}\n\n(Real AI output will appear here once Gemini is connected.)`
  })
}
