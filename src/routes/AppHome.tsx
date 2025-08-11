import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import FooterTicker from '../components/FooterTicker'
import GlassCard from '../components/GlassCard'
import { useNavigate } from 'react-router-dom'
import { generatePackage } from '../lib/generatePrompt'

type GenResp = {
  prompt?: string
  type?: string
  questions?: string[]
  language?: string   // e.g., "de", "en-US", "ar"
}

const RTL_LANGS = ['ar', 'he', 'fa', 'ur'] as const

const DICT = {
  en: {
    yourGoal: 'Your Goal',
    goalPlaceholder: 'e.g., Write a persuasive email inviting customers to try our new product…',
    generateQs: 'Generate Follow-up Questions',
    detectedTask: 'Detected task',
    answerFew: 'Answer a few questions',
    yourAnswer: 'Your answer…',
    generateMyPrompt: 'Generate My Prompt',
    thinking: 'Thinking…',
  },
  de: {
    yourGoal: 'Dein Ziel',
    goalPlaceholder: 'z. B. Verfasse eine überzeugende E-Mail, um Kund:innen für unser neues Produkt zu gewinnen…',
    generateQs: 'Rückfragen generieren',
    detectedTask: 'Erkannte Aufgabe',
    answerFew: 'Beantworte ein paar Fragen',
    yourAnswer: 'Deine Antwort…',
    generateMyPrompt: 'Meinen Prompt erstellen',
    thinking: 'Denke nach…',
  },
} as const

export default function AppHome(){
  const [goal, setGoal] = useState('')
  const [questions, setQuestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [taskType, setTaskType] = useState('')
  const [initialPrompt, setInitialPrompt] = useState('')
  // start with browser language, but we’ll immediately replace it with the backend-detected language
  const [uiLang, setUiLang] = useState<string>(navigator.language || 'en')
  const nav = useNavigate()

  // very light i18n helper
  const t = <K extends keyof typeof DICT['en']>(key: K) => {
    const base = (uiLang || 'en').toLowerCase()
    const langKey = base.startsWith('de') ? 'de' : 'en'
    return DICT[langKey][key]
  }

  // reflect language + direction on <html> for a11y/RTL
  useEffect(() => {
    const lang = (uiLang || 'en').toLowerCase()
    document.documentElement.lang = lang
    document.documentElement.dir = RTL_LANGS.some(c => lang.startsWith(c)) ? 'rtl' : 'ltr'
  }, [uiLang])

  async function generateQuestions(){
    setLoading(true)
    try{
      // OPTIONAL: pass browser locale as a weak hint only (backend mirrors goal text language)
      const localeHint = navigator.language || 'en'

      const data: GenResp = await (generatePackage as any)(goal, { locale: localeHint })

      setQuestions(data?.questions || [])
      setTaskType(data?.type || '')
      setInitialPrompt(data?.prompt || '')

      // use backend-detected language for UI
      const detected = (data?.language || localeHint || 'en').toLowerCase()
      setUiLang(detected)

      // persist for the next steps
      sessionStorage.setItem('ms_lang', detected)
      sessionStorage.setItem('ms_locale', localeHint)
    }catch(e){
      console.error(e)
      alert('Error generating questions')
    }finally{
      setLoading(false)
    }
  }

  function proceed(){
    sessionStorage.setItem('ms_goal', goal)
    sessionStorage.setItem('ms_questions', JSON.stringify(questions))
    sessionStorage.setItem('ms_type', taskType)
    sessionStorage.setItem('ms_initial_prompt', initialPrompt)
    nav('/app/refine')
  }

  return (
    <div className="bg-aurora min-h-screen">
      <Navbar/>
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-12 grid lg:grid-cols-2 gap-8">
        <div className="glass rounded-3xl p-6">
          <div className="text-sm text-white/80">{t('yourGoal')}</div>
          <textarea
            value={goal}
            onChange={e=>setGoal(e.target.value)}
            placeholder={t('goalPlaceholder')}
            className="mt-2 w-full h-40 rounded-xl bg-white/10 border border-white/20 p-3"
          />
          <button
            disabled={!goal||loading}
            onClick={generateQuestions}
            className="mt-4 w-full rounded-xl px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-indigo-500 disabled:opacity-60"
          >
            {loading ? t('thinking') : t('generateQs')}
          </button>

          {taskType && (
            <div className="mt-3 text-xs text-white/60">
              {t('detectedTask')}: <span className="text-white/80">{taskType}</span>
            </div>
          )}
        </div>

        <div>
          {questions.length>0 && (
            <GlassCard>
              <div className="text-lg font-semibold">{t('answerFew')}</div>
              <div className="mt-4 space-y-4">
                {questions.map((q,i)=> (
                  <div key={i} className="glass rounded-2xl p-4">
                    <div className="text-white/80 text-sm">{q}</div>
                    <textarea
                      className="mt-2 w-full h-24 rounded-xl bg-white/10 border border-white/20 p-2"
                      placeholder={t('yourAnswer')}
                      onChange={e=>{
                        const key = `ms_answer_${i}`
                        sessionStorage.setItem(key, e.target.value)
                      }}
                    />
                  </div>
                ))}
              </div>
              <button onClick={proceed} className="mt-4 w-full rounded-xl px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-indigo-500">
                {t('generateMyPrompt')}
              </button>
            </GlassCard>
          )}
        </div>
      </section>
      <FooterTicker/>
    </div>
  )
}
