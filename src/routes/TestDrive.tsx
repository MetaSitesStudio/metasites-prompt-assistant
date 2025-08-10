import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import FooterTicker from '../components/FooterTicker'
import GlassCard from '../components/GlassCard'
import CopyButton from '../components/CopyButton'
import { post } from '../lib/api'

type DriveResp = { sample?: string; note?: string }

const TYPE_OPTIONS = ['email','essay','ad','social','script','image','general'] as const
type PromptType = typeof TYPE_OPTIONS[number]

// Try multiple keys in case different steps saved under different names
function getSavedPrompt(): string {
  const keys = [
    'ms_final_prompt',
    'ms_enhanced_prompt',
    'ms_generated_prompt',
    'ms_prompt'
  ]
  for (const k of keys) {
    const v = sessionStorage.getItem(k)
    if (v && v.trim().length > 0) return v
  }
  return ''
}

function getSavedType(): PromptType | '' {
  const v = sessionStorage.getItem('ms_type')?.toLowerCase().trim()
  if (!v) return ''
  if ((TYPE_OPTIONS as readonly string[]).includes(v)) return v as PromptType
  return ''
}

// Heuristic fallback if no saved type
function inferTypeFromPrompt(p: string): PromptType {
  const t = p.toLowerCase()
  if (/\bsubject\b|\bdear\b|\bemail\b/.test(t)) return 'email'
  if (/\boutline\b|^##|^# |\bthesis\b|\bessay\b/.test(t)) return 'essay'
  if (/\bhook\b|\bcta\b|\bad\b|\bheadline\b/.test(t)) return 'ad'
  if (/\binstagram\b|\bfacebook\b|\btwitter\b|\bx\b|\btiktok\b|\bcaption\b/.test(t)) return 'social'
  if (/\bscript\b|\bscene\b|\bvoiceover\b|\bcamera\b/.test(t)) return 'script'
  if (/\bimage prompt\b|\bar\b|\baspect ratio\b|\bnegative prompt\b|\bstylize\b/.test(t)) return 'image'
  return 'general'
}

export default function TestDrive(){
  const [result, setResult] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const prompt = getSavedPrompt()
        if (!prompt) {
          setResult('')
          setNote('No prompt found in session. Go back and generate an enhanced prompt first.')
          return
        }
        const type = getSavedType() || inferTypeFromPrompt(prompt)
        const data = await post<DriveResp>('ai-testdrive', { prompt, type })
        setResult((data.sample || '').trim())
        setNote(data.note || '')
      } catch (e) {
        console.error(e)
        setError('Test Drive failed. Please try again.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="bg-aurora min-h-screen">
      <Navbar/>
      <section className="max-w-4xl mx-auto px-4 lg:px-8 py-12 space-y-6">
        <div className="text-2xl font-bold">Test Drive Result</div>
        <GlassCard>
          {loading && <div className="text-white/80 text-sm">Generating preview…</div>}
          {!loading && error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm">
              {error}
            </div>
          )}
          {!loading && !error && !result && (
            <div className="text-white/80 text-sm">
              {note || 'No preview returned. Try adjusting the prompt and run again.'}
            </div>
          )}
          {result && (
            <>
              <pre className="whitespace-pre-wrap text-white/90 text-sm font-mono">{result}</pre>
              <div className="mt-3"><CopyButton text={result}/></div>
            </>
          )}
        </GlassCard>
      </section>
      <FooterTicker/>
    </div>
  )
}
