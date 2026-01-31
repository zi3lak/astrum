import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Star, Compass, ScrollText, Sparkles, Zap, 
  ChevronRight, Wind, Flame, Droplets, Mountain,
  BrainCircuit, MessageSquareQuote, Loader2, Globe
} from 'lucide-react';

// --- TYPY I STAŁE ---
type Month = {
  name: string;
  days: number;
  meaning: string;
  deity: string;
  color: string;
  element: string;
};

const SlavicCalendar = () => {
  const [now, setNow] = useState(new Date());
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [audioEnabled, setAudioEnabled] = useState(false);
  
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiResponse, setGeminiResponse] = useState("");
  const [oracleQuery, setOracleQuery] = useState("");

  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('slavic_mystic_notes');
    return saved ? JSON.parse(saved) : {};
  });

  const months: Month[] = useMemo(() => [
    { name: 'Ramhat', days: 41, meaning: 'Boski Początek', deity: 'Ramhat', color: 'text-amber-500', element: 'Ogień' },
    { name: 'Ajlet', days: 40, meaning: 'Nowe Dary', deity: 'Rozana', color: 'text-rose-500', element: 'Ziemia' },
    { name: 'Bejlet', days: 41, meaning: 'Białe Światło', deity: 'Bałwan', color: 'text-blue-200', element: 'Woda' },
    { name: 'Gejlet', days: 40, meaning: 'Zamieć i Chłód', deity: 'Marzanna', color: 'text-indigo-400', element: 'Powietrze' },
    { name: 'Dajlet', days: 41, meaning: 'Odrodzenie Przyrody', deity: 'Siemargl', color: 'text-emerald-500', element: 'Ogień' },
    { name: 'Elet', days: 40, meaning: 'Siew i Nadzieja', deity: 'Waruna', color: 'text-green-400', element: 'Ziemia' },
    { name: 'Vejlet', days: 41, meaning: 'Wiatr i Przemiany', deity: 'Swaróg', color: 'text-orange-600', element: 'Woda' },
    { name: 'Hejlet', days: 40, meaning: 'Zbiór Darów', deity: 'Rod', color: 'text-yellow-600', element: 'Powietrze' },
    { name: 'Tajlet', days: 41, meaning: 'Odpoczynek', deity: 'Kupała', color: 'text-purple-500', element: 'Ogień' },
  ], []);

  // --- GEMINI API ---
  const callGemini = async (prompt: string, systemPrompt = "") => {
    setGeminiLoading(true);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [{
        role: "user",
        parts: [{ text: `${systemPrompt}\n\nZapytanie: ${prompt}` }]
      }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 400 }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Błąd API');
      
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setGeminiResponse(text || "Wyrocznia pogrążyła się w zadumie...");
    } catch (err) {
      setGeminiResponse("Połączenie z przodkami zostało przerwane. Sprawdź klucz API.");
    } finally {
      setGeminiLoading(false);
    }
  };

  const playSound = useCallback((freq = 440, type: OscillatorType = 'sine') => {
    if (!audioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1);
    } catch (e) {}
  }, [audioEnabled]);

  const slavicDate = useMemo(() => {
    const startOfYear = new Date(now.getFullYear(), 8, 21);
    if (now < startOfYear) startOfYear.setFullYear(now.getFullYear() - 1);
    const diffDays = Math.floor(Math.abs(now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    let dayAcc = 0, monthIdx = 0, dMonth = 1;

    for (let i = 0; i < months.length; i++) {
      if (diffDays < dayAcc + months[i].days) {
        monthIdx = i;
        dMonth = diffDays - dayAcc + 1;
        break;
      }
      dayAcc += months[i].days;
    }
    const sYear = now.getFullYear() + 5508 + (now.getMonth() > 8 || (now.getMonth() === 8 && now.getDate() >= 21) ? 1 : 0);
    return { monthIdx, day: dMonth, year: sYear };
  }, [now, months]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDayClick = (d: number) => {
    setSelectedDay(d);
    setGeminiResponse("");
    playSound(200 + d * 10, 'triangle');
  };

  return (
    <div 
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
      className="min-h-screen bg-[#020205] text-slate-100 p-4 md:p-8 font-serif overflow-x-hidden relative"
    >
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20" 
           style={{ transform: `translate(${(mousePos.x - window.innerWidth/2) * 0.01}px, ${(mousePos.y - window.innerHeight/2) * 0.01}px)` }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-slow">
           <svg width="600" height="600" viewBox="0 0 100 100" className="text-amber-500/20">
              <path fill="currentColor" d="M50 0 L55 45 L100 50 L55 55 L50 100 L45 55 L0 50 L45 45 Z" />
           </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Globe className="w-6 h-6 text-blue-400" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-blue-400">Czas Współczesny</p>
                <h3 className="text-2xl font-mono">{now.toLocaleTimeString()}</h3>
              </div>
            </div>
          </div>
          <div className="bg-amber-500/5 backdrop-blur-xl border border-amber-500/20 p-6 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Compass className="w-6 h-6 text-amber-500" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-amber-500">Era Gwiezdnej Świątyni</p>
                <h3 className="text-2xl font-mono">Rok {slavicDate.year}</h3>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Menu boczne */}
          <aside className="lg:col-span-3 space-y-4">
            <div 
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all"
            >
              <Zap className={audioEnabled ? "text-amber-500" : "text-white/20"} />
              <span className="text-xs font-bold uppercase tracking-widest">Dźwięk: {audioEnabled ? 'ON' : 'OFF'}</span>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <h3 className="text-[10px] uppercase tracking-widest mb-4 opacity-50">Krąg Miesięcy</h3>
              <div className="space-y-1 max-h-64 overflow-y-auto pr-2 custom-scroll">
                {months.map((m, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedMonthIdx(i)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-all ${selectedMonthIdx === i ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'hover:bg-white/5'}`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              callGemini(oracleQuery, "Jesteś Wyrocznią Gwiezdnej Świątyni. Odpowiadaj mistycznie.");
              setOracleQuery("");
            }} className="bg-indigo-950/20 p-4 rounded-2xl border border-white/10">
              <h3 className="text-[10px] uppercase tracking-widest mb-3 text-purple-400">Wyrocznia</h3>
              <input 
                value={oracleQuery}
                onChange={(e) => setOracleQuery(e.target.value)}
                placeholder="Zadaj pytanie..."
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs mb-2 outline-none focus:border-purple-500"
              />
              <button disabled={geminiLoading} className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 rounded-lg text-[10px] uppercase font-bold tracking-widest">
                {geminiLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Zapytaj'}
              </button>
            </form>
          </aside>

          {/* Kalendarz */}
          <main className="lg:col-span-6 space-y-6">
            <div className="bg-white/5 border border-white/10 p-6 md:p-10 rounded-[2.5rem] relative overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className={`text-5xl font-black uppercase ${months[selectedMonthIdx].color}`}>{months[selectedMonthIdx].name}</h2>
                  <p className="text-xs italic opacity-50 mt-1">{months[selectedMonthIdx].meaning}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  {months[selectedMonthIdx].element === 'Ogień' && <Flame className="text-orange-500" />}
                  {months[selectedMonthIdx].element === 'Woda' && <Droplets className="text-blue-500" />}
                  {months[selectedMonthIdx].element === 'Ziemia' && <Mountain className="text-emerald-500" />}
                  {months[selectedMonthIdx].element === 'Powietrze' && <Wind className="text-sky-400" />}
                </div>
              </div>

              <div className="grid grid-cols-9 gap-2">
                {[...Array(months[selectedMonthIdx].days)].map((_, i) => {
                  const d = i + 1;
                  const isToday = slavicDate.monthIdx === selectedMonthIdx && slavicDate.day === d;
                  return (
                    <button 
                      key={i} 
                      onClick={() => handleDayClick(d)}
                      className={`aspect-square rounded-xl border flex items-center justify-center text-lg font-bold transition-all
                        ${isToday ? 'bg-white text-black border-white scale-110 z-10 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            {geminiResponse && (
              <div className="bg-gradient-to-br from-white/10 to-transparent p-6 rounded-3xl border border-white/10 animate-in fade-in zoom-in">
                <h4 className="text-[10px] uppercase tracking-widest text-amber-500 mb-2 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> Głos Przodków
                </h4>
                <p className="text-sm italic leading-relaxed opacity-90">{geminiResponse}</p>
              </div>
            )}
          </main>

          {/* Panel boczny prawy */}
          <aside className="lg:col-span-3 space-y-4">
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 min-h-[300px] flex flex-col">
              {selectedDay ? (
                <div className="flex-grow flex flex-col">
                  <h3 className="text-2xl font-bold">{selectedDay} {months[selectedMonthIdx].name}</h3>
                  <button 
                    onClick={() => callGemini(
                      `Dzień ${selectedDay} miesiąca ${months[selectedMonthIdx].name}. Patron: ${months[selectedMonthIdx].deity}.`,
                      "Jesteś żercą. Opisz energię tego dnia w 2-3 zdaniach."
                    )}
                    disabled={geminiLoading}
                    className="mt-4 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] uppercase font-bold tracking-widest"
                  >
                    Interpretuj Dzień
                  </button>
                  <textarea 
                    value={notes[`${selectedMonthIdx}-${selectedDay}`] || ''}
                    onChange={(e) => {
                      const key = `${selectedMonthIdx}-${selectedDay}`;
                      const newNotes = {...notes, [key]: e.target.value};
                      setNotes(newNotes);
                      localStorage.setItem('slavic_mystic_notes', JSON.stringify(newNotes));
                    }}
                    placeholder="Twoje przemyślenia..."
                    className="mt-4 w-full flex-grow bg-black/40 border border-white/5 rounded-xl p-4 text-xs outline-none focus:border-amber-500/50 resize-none"
                  />
                </div>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center opacity-20 text-center">
                  <BrainCircuit className="w-12 h-12 mb-4" />
                  <p className="text-[10px] uppercase tracking-widest">Wybierz dzień z kręgu</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 120s linear infinite; }
        .custom-scroll::-webkit-scrollbar { width: 3px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default SlavicCalendar;
