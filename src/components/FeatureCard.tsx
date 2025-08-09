import { motion } from "framer-motion"
import { ReactNode } from "react"

export default function FeatureCard({
  title, children, delay = 0
}: { title: string; children: ReactNode; delay?: number }){
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay }}
      className="feature-card"
    >
      <div className="feature-border" aria-hidden />
      <div className="glass rounded-3xl p-6 relative">
        <div className="text-lg font-semibold">{title}</div>
        <div className="mt-2 text-white/80">{children}</div>
      </div>
    </motion.div>
  )
}
