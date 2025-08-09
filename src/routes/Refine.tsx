import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import FooterTicker from '../components/FooterTicker'
import GlassCard from '../components/GlassCard'
import CopyButton from '../components/CopyButton'
import { post } from '../lib/api'
import { Link } from 'react-router-dom'

export default function Refine(){
  const [enhanced, setEnhanced] = useState('')
  useEffect(()=>{
    const goal = sessionStorage.getItem('ms_goal')||''
    const questions = JSON.parse(sessionStorage.getItem('ms_questions')||'[]') as string[]
    const answers = questions.map((_,i)=> sessionStorage.getItem(`ms_answer_${i}`)||'')
    ;(async()=>{
      try{
        const data = await post<{prompt:string}>('ai-enhance', { goal, questions, answers })
        setEnhanced(data.prompt)
        sessionStorage.setItem('ms_prompt', data.prompt)
      }catch(e){ alert('Error building prompt'); }
    })()
  },[])

  return (
    <div className="bg-aurora min-h-screen">
      <Navbar/>
      <section className="max-w-4xl mx-auto px-4 lg:px-8 py-12 space-y-6">
        <GlassCard>
          <div className="text-2xl font-bold">Your Enhanced Prompt</div>
          <pre className="mt-4 whitespace-pre-wrap text-white/90 text-sm font-mono">{enhanced || '…'}</pre>
          <div className="mt-4 flex flex-wrap gap-2">
            <CopyButton text={enhanced}/>
            <Link to="/app/test-drive" className="rounded-xl px-4 py-2 bg-white/10 hover:bg-white/15">Test Drive</Link>
            <Link to="/app/variations" className="rounded-xl px-4 py-2 bg-white/10 hover:bg-white/15">Get Variations</Link>
            <Link to="/app" className="rounded-xl px-4 py-2 bg-white/10 hover:bg-white/15">Start Over</Link>
          </div>
        </GlassCard>
      </section>
      <FooterTicker/>
    </div>
  )
}
