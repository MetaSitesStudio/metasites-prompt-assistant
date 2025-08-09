import Navbar from '../components/Navbar'
import FooterTicker from '../components/FooterTicker'
import { Link } from 'react-router-dom'
export default function Landing(){
  return (
    <div className="bg-aurora min-h-screen">
      <Navbar/>
      <section className="max-w-7xl mx-auto px-4 lg:px-8 pt-20 pb-24 grid lg:grid-cols-2 gap-10 items-center">
        <div className="reveal">
          <h1 className="text-5xl font-extrabold leading-tight">Your AI Co Pilot — from first prompt to <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 to-indigo-300">pro‟level results</span>.</h1>
          <p className="mt-6 text-white/80 max-w-xl">Describe your goal. The assistant crafts questions, builds an enhanced prompt, and gives you variations & a test drive.</p>
          <div className="mt-8 flex gap-3">
            <Link to="/app" className="rounded-2xl px-5 py-3 bg-gradient-to-r from-fuchsia-500 to-indigo-500">Start Free</Link>
            <a href="#features" className="rounded-2xl px-5 py-3 border border-white/20 bg-white/5 hover:bg-white/10">See Features</a>
          </div>
        </div>
        <div className="reveal">
          <div className="glass rounded-3xl p-6">
            <div className="text-sm text-white/70">Live Prompt Preview</div>
            <div className="mt-3 rounded-2xl bg-black/50 border border-white/10 p-4 text-sm">
              <div className="text-white/80">Goal:</div>
              <div className="mt-1 text-white/90">“Write a persuasive email inviting customers to try our new product.”</div>
              <div className="mt-4 text-white/80">Assistant Suggests:</div>
              <ul className="mt-1 list-disc list-inside space-y-1 text-white/90"><li>Audience: last 6 months buyers</li><li>Tone: friendly, benefit‟driven</li><li>CTA: Start your 7‟day free trial</li></ul>
              <Link to="/app" className="mt-4 inline-block w-full text-center rounded-xl px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-indigo-500">Generate Optimized Prompt</Link>
            </div>
          </div>
        </div>
      </section>
      <FooterTicker/>
    </div>
  )
}
