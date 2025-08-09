import { ReactNode } from 'react'
export default function GlassCard({children}:{children:ReactNode}){
  return <div className="glass rounded-3xl p-6">{children}</div>
}
