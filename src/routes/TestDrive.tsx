import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import FooterTicker from '../components/FooterTicker'
import GlassCard from '../components/GlassCard'
import CopyButton from '../components/CopyButton'
import { post } from '../lib/api'

export default function TestDrive(){
  const [result, setResult] = useState('')

  useEffect(() => {
    (async () => {
      const prompt = sessionStorage.getItem('ms_prompt') || ''
      const data = await post<{ preview: string }>('ai-testdrive', { prompt })
      setResult(data.preview)
    })()
  }, [])

  return (
    <div className="bg-aurora min-h-screen">
      <Navbar/>
      <section className="max-w-4xl mx-auto px-4 lg:px-8 py-12 space-y-6">
        <div className="text-2xl font-bold">Test Drive Result</div>
        <GlassCard>
          <pre className="whitespace-pre-wrap text-white/90 text-sm font-mono">{result}</pre>
          <div className="mt-3"><CopyButton text={result}/></div>
        </GlassCard>
      </section>
      <FooterTicker/>
    </div>
  )
}
