import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import FooterTicker from '../components/FooterTicker'
import GlassCard from '../components/GlassCard'
import CopyButton from '../components/CopyButton'
import { post } from '../lib/api'

export default function Variations(){
  const [vars, setVars] = useState<string[]>([])

  useEffect(() => {
    (async () => {
      const prompt = sessionStorage.getItem('ms_prompt') || ''
      const data = await post<{ variations: string[] }>('ai-variations', { prompt })
      setVars(data.variations)
    })()
  }, [])

  return (
    <div className="bg-aurora min-h-screen">
      <Navbar/>
      <section className="max-w-4xl mx-auto px-4 lg:px-8 py-12 space-y-6">
        <div className="text-2xl font-bold">Prompt Variations</div>
        {vars.map((v, i) => (
          <GlassCard key={i}>
            <pre className="whitespace-pre-wrap text-white/90 text-sm font-mono">{v}</pre>
            <div className="mt-3"><CopyButton text={v}/></div>
          </GlassCard>
        ))}
      </section>
      <FooterTicker/>
    </div>
  )
}
