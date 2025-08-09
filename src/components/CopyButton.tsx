export default function CopyButton({text}:{text:string}){
  return <button onClick={async()=>{ if(!text) return; await navigator.clipboard.writeText(text)}} className="rounded-xl px-3 py-2 border border-white/20 bg-white/5 hover:bg-white/10">Copy</button>
}
