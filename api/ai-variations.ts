import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse){
  const { prompt = '' } = req.body || {}
  res.json({
    variations: [
      `${prompt}\n\nVariation A: shorter, more imperative.`,
      `${prompt}\n\nVariation B: more descriptive, sensory details.`,
      `${prompt}\n\nVariation C: structured with bullets and constraints.`
    ]
  })
}
