export default function FooterTicker(){
  const items = [
    'AI prompt engineering', 'Automation & CRM (GHL)', 'SEO & content systems',
    'High-performance web design', 'Funnel builds', 'Chatbots & RAG knowledge bases',
    'Analytics & CRO', 'YouTube scripts & YT growth', 'Brand voice systems'
  ]
  return (
    <div className="ticker text-sm">
      <div className="track">
        {Array(2).fill(0).map((_,k)=> (
          <span key={k} className="px-6 text-white/80">{items.join('  •  ')}</span>
        ))}
      </div>
    </div>
  )
}
