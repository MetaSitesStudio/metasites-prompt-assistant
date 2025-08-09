import { Link } from 'react-router-dom'

export default function Navbar(){
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur">
      <nav className="max-w-7xl mx-auto h-16 px-4 lg:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="MetaSites Studio logo" className="w-7 h-7"/>
          <span className="font-semibold tracking-tight">MetaSites Studio</span>
          <span className="text-white/50">Prompt Assistant</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm">
          <a href="/#features" className="hover:text-fuchsia-300">Features</a>
          <a href="/#how" className="hover:text-fuchsia-300">How it works</a>
          <a href="/#pricing" className="hover:text-fuchsia-300">Pricing</a>
          <a href="/#faq" className="hover:text-fuchsia-300">FAQ</a>
        </div>
        <Link to="/app" className="rounded-2xl px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-indigo-500">Try it free</Link>
      </nav>
    </header>
  )
}
