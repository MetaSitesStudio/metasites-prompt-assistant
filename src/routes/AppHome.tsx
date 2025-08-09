import { useState } from 'react'
import Navbar from '../components/Navbar'
import FooterTicker from '../components/FooterTicker'
import GlassCard from '../components/GlassCard'
import { post } from '../lib/api'
import { useNavigate } from 'react-router-dom'

export default function AppHome(){
  const [goal, setGoal] = useState('')
  const [questions, setQuestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  async function generateQuestions(){
    setLoading(true)
    try{
      const data = await post<{questions:string[]}>('ai-questions', { goal })
      setQuestions(data.questions)
      setLoading(false)
    }catch(e){ setLoading(false); alert('Error generating questions') }
  }

  function proceed(){
    sessionStorage.setItem('ms_goal', goal)
    sessionStorage.setItem('ms_questions', JSON.stringify(questions))
    nav('/app/refine')
  }

  return (
    <div className="bg-aurora min-h-screen">
      <Navbar/>
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-12 grid lg:grid-cols-2 gap-8">
        <div className="glass rounded-3xl p-6">
          <div className="text-sm text-white/80">Your Goal</div>
          <textarea value={goal} onChange={e=>setGoal(e.target.value)} placeholder="e.g., Photo prompt for fabulous spaghetti pomodoro…" className="mt-2 w-full h-40 rounded-xl bg-white/10 border border-white/20 p-3"/>
          <button disabled={!goal||loading} onClick={generateQuestions} className="mt-4 w-full rounded-xl px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-indigo-500">{loading? 'Thinking…':'Generate Follow‑up Questions'}</button>
        </div>
        <div>
          {questions.length>0 && (
            <GlassCard>
              <div className="text-lg font-semibold">Answer a few questions</div>
              <div className="mt-4 space-y-4">
                {questions.map((q,i)=> (
                  <div key={i} className="glass rounded-2xl p-4">
                    <div className="text-white/80 text-sm">{q}</div>
                    <textarea className="mt-2 w-full h-24 rounded-xl bg-white/10 border border-white/20 p-2" placeholder="Your answer…" onChange={e=>{
                      const key = `ms_answer_${i}`; sessionStorage.setItem(key, e.target.value)
                    }} />
                  </div>
                ))}
              </div>
              <button onClick={proceed} className="mt-4 w-full rounded-xl px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-indigo-500">Generate My Prompt</button>
            </GlassCard>
          )}
        </div>
      </section>
      <FooterTicker/>
    </div>
  )
}
