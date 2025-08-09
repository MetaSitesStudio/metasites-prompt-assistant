import { Link } from "react-router-dom"
import { motion, useMotionValue, useTransform } from "framer-motion"
import { useRef } from "react"

export default function Hero(){
  // simple parallax based on mouse
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rx = useTransform(y, [-50, 50], [8, -8])
  const ry = useTransform(x, [-50, 50], [-8, 8])
  const ref = useRef<HTMLDivElement>(null)

  const onMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    x.set(e.clientX - (rect.left + rect.width/2))
    y.set(e.clientY - (rect.top + rect.height/2))
  }

  return (
    <section
      ref={ref}
      onMouseMove={onMove}
      className="relative overflow-hidden"
    >
      {/* animated aurora background */}
      <div className="absolute inset-0 aurora" aria-hidden />

      <div className="relative max-w-7xl mx-auto px-4 lg:px-8 pt-20 pb-24 grid lg:grid-cols-2 gap-10 items-center">
        <div className="reveal">
          <h1 className="text-5xl font-extrabold leading-tight">
            Your AI co‑pilot — from idea to
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 to-indigo-300"> pro‑level results</span>.
          </h1>
          <p className="mt-6 text-white/80 max-w-xl">
            Answer a few smart questions and get a polished, execution‑ready prompt —
            plus variations and a quick test drive.
          </p>

          <div className="mt-8 flex gap-3">
            <Link to="/app" className="btn-primary ring-glow">Start Free</Link>
            <a href="#demo" className="btn-ghost">Watch 60‑sec Demo</a>
          </div>

          {/* time-saved meter placeholder (activates in Step 2) */}
          <div className="mt-6 flex items-center gap-3 text-sm text-white/70">
            <div className="meter-track"><div className="meter-fill" style={{width:"20%"}}/></div>
            <span>Time saved: ~20%</span>
          </div>
        </div>

        <motion.div
          className="reveal"
          style={{ rotateX: rx, rotateY: ry }}
          transition={{ type: "spring", stiffness: 120, damping: 15 }}
        >
          <div className="glass rounded-3xl p-6 shadow-2xl">
            <div className="text-sm text-white/70">Live Prompt Preview</div>
            <div className="mt-3 rounded-2xl bg-black/50 border border-white/10 p-4 text-sm">
              <div className="text-white/80">Goal:</div>
              <div className="mt-1 text-white/90">“Write a persuasive email inviting customers to try our new product.”</div>
              <div className="mt-4 text-white/80">Assistant Suggests:</div>
              <ul className="mt-1 list-disc list-inside space-y-1 text-white/90">
                <li>Audience: last 6 months buyers</li>
                <li>Tone: friendly, benefit‑driven</li>
                <li>CTA: Start your 7‑day free trial</li>
              </ul>
              <Link to="/app" className="mt-4 inline-block w-full text-center btn-primary">Generate Optimized Prompt</Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
