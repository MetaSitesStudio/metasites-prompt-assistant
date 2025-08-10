// src/routes/Variations.tsx
import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import FooterTicker from "../components/FooterTicker"
import GlassCard from "../components/GlassCard"
import CopyButton from "../components/CopyButton"
import { post } from "../lib/api"

export default function Variations(){
  const [variants, setVariants] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    (async () => {
      try{
        const prompt = sessionStorage.getItem("ms_initial_prompt") || sessionStorage.getItem("ms_prompt") || ""
        const type = sessionStorage.getItem("ms_type") || "other"
        const language = sessionStorage.getItem("ms_lang") || navigator.language || "en"
        if(!prompt){ setError("No prompt found. Start from the builder."); setLoading(false); return }

        const data = await post<{ variants: string[] }>("ai-variations", {
          prompt, type, language, count: 5
        })
        setVariants(data?.variants || [])
      }catch(e:any){
        console.error(e)
        setError("Could not load variations.")
      }finally{
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="bg-aurora min-h-screen">
      <Navbar/>
      <section className="max-w-5xl mx-auto px-4 lg:px-8 py-12 space-y-6">
        <div className="text-2xl font-bold">Variations</div>

        {loading && <div className="text-white/80">Loading…</div>}
        {error && <div className="text-red-300">{error}</div>}

        {!loading && !error && (
          <div className="grid md:grid-cols-2 gap-4">
            {variants.map((v, i) => (
              <GlassCard key={i}>
                <div className="text-sm text-white/80 mb-2">Option {i+1}</div>
                <pre className="whitespace-pre-wrap text-white/90 text-sm font-mono">{v}</pre>
                <div className="mt-3"><CopyButton text={v}/></div>
              </GlassCard>
            ))}
          </div>
        )}
      </section>
      <FooterTicker/>
    </div>
  )
}
