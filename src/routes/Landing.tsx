import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import FooterTicker from '../components/FooterTicker'
import { Link } from 'react-router-dom'

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.06 * i, duration: 0.35 } })
}

export default function Landing(){
  return (
    <div className="bg-aurora min-h-screen">
      <Navbar/>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 pt-20 pb-24 grid lg:grid-cols-2 gap-10 items-center">
        <div className="reveal">
          <h1 className="text-5xl font-extrabold leading-tight">
            Your AI Co Pilot — from first prompt to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 to-indigo-300">
              pro-level results
            </span>.
          </h1>
          <p className="mt-6 text-white/80 max-w-xl">
            Describe your goal. The assistant asks laser-focused questions, builds an enhanced prompt,
            and gives you variations plus a quick test drive.
          </p>
          <div className="mt-8 flex gap-3">
            <Link to="/app" className="rounded-2xl px-5 py-3 bg-gradient-to-r from-fuchsia-500 to-indigo-500 hover:brightness-110 transition">
              Start Free
            </Link>
            <a href="#features" className="rounded-2xl px-5 py-3 border border-white/20 bg-white/5 hover:bg-white/10 transition">
              See Features
            </a>
          </div>
        </div>

        {/* Demo Video Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="reveal"
        >
          <div className="glass rounded-3xl p-6">
            <div className="text-sm text-white/70">30-second demo</div>
            <div className="mt-3 rounded-2xl bg-black/50 border border-white/10 p-0 overflow-hidden">
              <video
                className="w-full h-[360px] object-cover"
                playsInline
                muted
                controls
                preload="metadata"
                // Add a poster image to /public as demo-poster.jpg if you want a thumbnail:
                // poster="/demo-poster.jpg"
              >
                <source src="/demo.mp4" type="video/mp4" />
                Sorry, your browser doesn’t support embedded videos.
              </video>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-7xl mx-auto px-4 lg:px-8 pb-20">
        <h2 className="text-3xl font-bold">Features</h2>

        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Smart Follow-ups', desc: 'Auto-questions narrow scope, audience, format, and tone in seconds.', icon: '🤖' },
            { title: 'Enhanced Prompt Builder', desc: 'Merges your answers into a clear, execution-ready master prompt.', icon: '🧩' },
            { title: 'One-Click Variations', desc: 'Get 3–6 alternate angles: persuasive, technical, storytelling, etc.', icon: '🎛️' },
            { title: 'Test Drive', desc: 'Preview sample outputs instantly before you copy or run them elsewhere.', icon: '🚗' },
            { title: 'History & Save', desc: 'Keep your best prompts, tag by project, and re-use with one tap.', icon: '📚' },
            { title: 'Multi-Model Friendly', desc: 'Works great with ChatGPT, Gemini, Midjourney — your choice.', icon: '🧠' }
          ].map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={cardVariants}
              className="group relative rounded-3xl p-[1px] bg-gradient-to-br from-white/20 to-white/5"
            >
              <div className="rounded-3xl h-full w-full bg-black/50 backdrop-blur-md p-6 border border-white/10 transition-transform group-hover:-translate-y-1">
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="text-lg font-semibold">{f.title}</div>
                <p className="mt-2 text-white/80">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="max-w-7xl mx-auto px-4 lg:px-8 pb-20">
        <h2 className="text-3xl font-bold">How it works</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          {[
            { step: '1', title: 'Describe', desc: 'Type your goal in plain language. No template needed.' },
            { step: '2', title: 'Refine', desc: 'Answer quick follow-ups; we assemble a precise, high-quality prompt.' },
            { step: '3', title: 'Launch', desc: 'Copy the prompt, try variations, or run a lightning test drive.' }
          ].map((s, i) => (
            <motion.div
              key={s.step}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={cardVariants}
              className="group rounded-3xl p-6 bg-white/5 border border-white/10 hover:bg-white/10 transition"
            >
              <div className="text-5xl font-extrabold text-white/70 group-hover:text-white/90 transition">{s.step}</div>
              <div className="mt-3 text-xl font-semibold">{s.title}</div>
              <p className="mt-2 text-white/80">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 lg:px-8 pb-24">
        <h2 className="text-3xl font-bold">Pricing</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="rounded-3xl p-6 bg-white/5 border border-white/10 hover:bg-white/10 transition"
          >
            <div className="text-lg font-semibold">Free</div>
            <div className="mt-2 text-3xl font-extrabold">$0</div>
            <ul className="mt-4 space-y-2 text-white/80 text-sm">
              <li>• 3 prompts/day</li>
              <li>• Core builder</li>
              <li>• Try variations</li>
            </ul>
            <Link to="/app" className="mt-5 inline-block w-full text-center rounded-xl px-4 py-2 bg-white/10 hover:bg-white/20 transition">
              Try it now
            </Link>
          </motion.div>

          {/* Promo */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="rounded-3xl p-6 bg-gradient-to-br from-fuchsia-600/20 to-indigo-600/20 border border-fuchsia-400/30"
          >
            <div className="text-lg font-semibold">Promo (3 months)</div>
            <div className="mt-2 text-3xl font-extrabold">$25</div>
            <ul className="mt-4 space-y-2 text-white/80 text-sm">
              <li>• Unlimited prompts</li>
              <li>• Test Drive included</li>
              <li>• Early access features</li>
            </ul>
            <Link to="/app" className="mt-5 inline-block w-full text-center rounded-xl px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-indigo-500 hover:brightness-110 transition">
              Get Promo
            </Link>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="rounded-3xl p-6 bg-white/5 border border-white/10 hover:bg-white/10 transition"
          >
            <div className="text-lg font-semibold">Pro</div>
            <div className="mt-2 text-3xl font-extrabold">
              $12<span className="text-white/70 text-base">/mo</span>
              <span className="text-white/50 text-base"> or </span>
              $99<span className="text-white/70 text-base">/yr</span>
            </div>
            <ul className="mt-4 space-y-2 text-white/80 text-sm">
              <li>• Unlimited prompts</li>
              <li>• Project history & tags</li>
              <li>• Priority improvements</li>
            </ul>
            <Link to="/app" className="mt-5 inline-block w-full text-center rounded-xl px-4 py-2 bg-white/10 hover:bg-white/20 transition">
              Go Pro
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-7xl mx-auto px-4 lg:px-8 pb-24">
        <h2 className="text-3xl font-bold">FAQ</h2>
        <div className="mt-6 space-y-4">
          <details className="glass rounded-3xl p-6">
            <summary className="cursor-pointer text-lg font-semibold">Do I need AI experience?</summary>
            <p className="mt-2 text-white/80">No. Just describe your goal; the assistant asks clarifying questions and builds the prompt.</p>
          </details>
          <details className="glass rounded-3xl p-6">
            <summary className="cursor-pointer text-lg font-semibold">Which models/tools does it work with?</summary>
            <p className="mt-2 text-white/80">Use the generated prompts in ChatGPT, Gemini, Midjourney, etc. Native integrations are coming.</p>
          </details>
          <details className="glass rounded-3xl p-6">
            <summary className="cursor-pointer text-lg font-semibold">What do I get on Pro?</summary>
            <p className="mt-2 text-white/80">Unlimited generations, advanced tools, and saved history.</p>
          </details>
        </div>
      </section>

      <FooterTicker/>
    </div>
  )
}
