import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Landing from './routes/Landing'
import AppHome from './routes/AppHome'
import Refine from './routes/Refine'
import Variations from './routes/Variations'
import TestDrive from './routes/TestDrive'

export default function App(){
  const loc = useLocation()
  useEffect(()=>{
    const io = new IntersectionObserver((entries)=> entries.forEach(e=>{if(e.isIntersecting) e.target.classList.add('show')}), {threshold:.15})
    document.querySelectorAll('.reveal').forEach(el=> io.observe(el))
    return ()=> io.disconnect()
  },[loc.pathname])
  return (
    <Routes>
      <Route path="/" element={<Landing/>} />
      <Route path="/app" element={<AppHome/>} />
      <Route path="/app/refine" element={<Refine/>} />
      <Route path="/app/variations" element={<Variations/>} />
      <Route path="/app/test-drive" element={<TestDrive/>} />
    </Routes>
  )
}
