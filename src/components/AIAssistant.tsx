import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Send, MessageCircle, Loader2, Bot } from 'lucide-react';

type ChatMsg = { role: 'user' | 'model'; text: string };

const DEEPSEEK_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY as string || '';
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

const SYSTEM_PROMPT = `Sən "BVM Asistent"sən — Azərbaycanın karyera və iş portalı olan BVM-in AI köməkçisisən. Sənin vəzifən istifadəçilərə CV hazırlamaqda, vakansiya axtarışında, müsahibə hazırlığında və tətbiqin istifadə qaydalarında kömək etməkdir. Qısa, aydın və faydalı cavablar ver. Azərbaycan dilində yaz.`;

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'model', text: 'Salam! Mən BVM Asistentəm. CV hazırlamaq, vakansiya tapmaq və ya müsahibə hazırlığı üçün kömək edə bilərəm. Sizə necə kömək edə bilərəm?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(360);
  const [height, setHeight] = useState(480);
  const resizingRef = useRef<{ startX: number; startY: number; startW: number; startH: number; dir: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const startResize = useCallback((dir: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = { startX: e.clientX, startY: e.clientY, startW: width, startH: height, dir };
  }, [width, height]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const r = resizingRef.current;
      if (!r) return;
      const dx = e.clientX - r.startX;
      const dy = e.clientY - r.startY;
      if (r.dir.includes('w')) setWidth(Math.max(280, Math.min(600, r.startW - dx)));
      if (r.dir.includes('n')) setHeight(Math.max(320, Math.min(700, r.startH - dy)));
      if (r.dir.includes('e')) setWidth(Math.max(280, Math.min(600, r.startW + dx)));
      if (r.dir.includes('s')) setHeight(Math.max(320, Math.min(700, r.startH + dy)));
    };
    const handleUp = () => { resizingRef.current = null; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      if (DEEPSEEK_KEY) {
        const history = [...messages, { role: 'user' as const, text }].map((message) => ({
          role: message.role === 'model' ? 'assistant' : 'user',
          content: message.text,
        }));
        const res = await fetch(DEEPSEEK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${DEEPSEEK_KEY}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
          }),
        });
        if (!res.ok) throw new Error(`DeepSeek request failed (${res.status})`);
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (typeof reply !== 'string' || !reply.trim()) throw new Error('DeepSeek returned an empty response');
        setMessages((prev) => [...prev, { role: 'model', text: reply }]);
      } else {
        setMessages((prev) => [...prev, { role: 'model', text: 'AI asistent hələ konfiqurasiya olunmayıb. Administrator ilə əlaqə saxlayın.' }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'model', text: 'Xəta baş verdi. Bir az sonra yenidən cəhd edin.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/40 flex items-center justify-center active:scale-90 transition-all hover:scale-105 border-2 border-red-400/50" aria-label="AI Asistent">
        <MessageCircle className="w-6 h-6 text-white" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-400 border-2 border-[#1C2541] animate-ping" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 bg-slate-900/90 border border-red-500/30 rounded-2xl shadow-2xl shadow-black/50 backdrop-blur-2xl flex flex-col overflow-hidden" style={{ width: `${width}px`, height: `${height}px`, maxWidth: 'calc(100vw - 1rem)', maxHeight: 'calc(100vh - 100px)' }}>
      <div onMouseDown={startResize('nw')} className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-10" />
      <div onMouseDown={startResize('ne')} className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-10" />
      <div onMouseDown={startResize('sw')} className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-10" />
      <div onMouseDown={startResize('se')} className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-10" />

      <div className="flex items-center justify-between px-4 py-3 border-b border-red-500/20 bg-red-500/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md shadow-red-500/30"><Bot className="w-4 h-4 text-white" /></div>
          <div><p className="text-sm font-bold text-white">BVM Asistent</p><p className="text-[9px] text-red-400 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> Online</p></div>
        </div>
        <button onClick={() => setOpen(false)} className="p-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 hover:text-white transition-all active:scale-90"><X className="w-4 h-4" /></button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-br-md' : 'bg-slate-800/80 border border-red-500/15 text-slate-200 rounded-bl-md'}`}>{msg.text}</div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-fade-in-up" role="status" aria-live="polite">
            <div className="flex items-center gap-2 bg-slate-800/80 border border-red-500/15 rounded-2xl rounded-bl-md px-3 py-2.5 text-xs text-slate-300">
              <Loader2 className="w-4 h-4 animate-spin text-red-400" />
              <span>Cavab hazırlanır</span>
              <span className="flex gap-0.5" aria-hidden="true">
                <span className="animate-pulse">.</span><span className="animate-pulse [animation-delay:150ms]">.</span><span className="animate-pulse [animation-delay:300ms]">.</span>
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-red-500/15 p-2.5 flex items-center gap-2 bg-slate-900/80">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Sualınızı yazın..." className="flex-1 bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-400/50 transition-all" />
        <button onClick={handleSend} disabled={loading || !input.trim()} className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md shadow-red-500/30 hover:opacity-90 active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
