import { useState, useEffect, useMemo, useCallback } from 'react';
import { Analytics } from "@vercel/analytics/next"
import { 
  Star, Compass, ScrollText, Sparkles, Zap, 
  ChevronRight, Wind, Flame, Droplets, Mountain,
  BrainCircuit, MessageSquareQuote, Loader2, Globe
} from 'lucide-react';

// Definicje typów
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

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 

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

  // --- GEMINI API INTEGRATION ---
  const callGemini = async (prompt: string, systemPrompt = "") => {
  setGeminiLoading(true);
  
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  // Używamy wersji v1beta, która obsługuje najnowsze modele
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          // Łączymy systemPrompt z promptem, aby uniknąć problemów ze strukturą systemInstruction
          { text: `${systemPrompt}\n\nUżytkownik pyta: ${prompt}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500,
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Szczegóły błędu 400:", data);
      setGeminiResponse("Błąd w formacie zapytania. Sprawdź konsolę.");
      return;
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    setGeminiResponse(text || "Wyrocznia milczy, ale nie z powodu błędu...");
  } catch (err) {
    console.error("Błąd sieci:", err);
    setGeminiResponse("Eteryczne połączenie zerwane.");
  } finally {
    setGeminiLoading(false);
  }
};

  const playMysticSound = useCallback((frequency = 440, type: OscillatorType = 'sine') => {
    if (!audioEnabled) return;
    try {
      const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 0.5, ctx.currentTime + 1);

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {}
  }, [audioEnabled]);

  const interpretDay = () => {
    if (selectedDay === null) return;
    const month = months[selectedMonthIdx];
    const prompt = `Zinterpretuj energię dnia: ${selectedDay} ${month.name}. Bóstwo patronujące: ${month.deity}, żywioł: ${month.element}. Co ten dzień oznacza w słowiańskiej kosmogonii? Podaj krótką radę duchową.`;
    const systemPrompt = "Jesteś słowiańskim żercą, mędrcem i strażnikiem tradycji. Mówisz językiem mistycznym, poetyckim, używając archaizmów. Twoje odpowiedzi są krótkie, ale pełne głębi.";
    callGemini(prompt, systemPrompt);
    playMysticSound(880, 'sine');
  };

  const askOracle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oracleQuery.trim()) return;
    const prompt = `Pytanie od poszukiwacza: "${oracleQuery}". Odpowiedz jako wyrocznia słowiańska, nawiązując do sił natury i Bogów.`;
    const systemPrompt = "Jesteś Wyrocznią Gwiezdnej Świątyni. Odpowiadasz zagadkami i mądrościami ludowymi. Nie używaj nowoczesnych terminów.";
    callGemini(prompt, systemPrompt);
    setOracleQuery("");
    playMysticSound(660, 'square');
  };

  const weekDays = ['Poniedziałek', 'Wtorek', 'Trzeciak', 'Czwartak', 'Piątek', 'Szóstak', 'Siedmak', 'Ósmak', 'Niedziela'];

  const slavicDate = useMemo(() => {
    const startOfYear = new Date(now.getFullYear(), 8, 21);
    if (now < startOfYear) startOfYear.setFullYear(now.getFullYear() - 1);
    const diffDays = Math.floor(Math.abs(now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    let dayAcc = 0, monthIdx = 0, dayOfSlavicMonth = 1;

    for (let i = 0; i < months.length; i++) {
      if (diffDays < dayAcc + months[i].days) {
        monthIdx = i;
        dayOfSlavicMonth = diffDays - dayAcc + 1;
        break;
      }
      dayAcc += months[i].days;
    }
    const slavicYear = now.getFullYear() + 5508 + (now.getMonth() > 8 || (now.getMonth() === 8 && now.getDate() >= 21) ? 1 : 0);
    return { monthIdx, day: dayOfSlavicMonth, year: slavicYear };
  }, [now, months]);

  const slavicHour = useMemo(() => (now.getHours() * 60 + now.getMinutes()) / 90 + 1, [now]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    setSelectedMonthIdx(slavicDate.monthIdx);
    return () => clearInterval(timer);
  }, [slavicDate.monthIdx]);

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setGeminiResponse("");
    playMysticSound(220 + day * 10, 'triangle');
  };

  return (
    <div 
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
      className="min-h-screen bg-[#020205] text-slate-100 p-2 md:p-8 font-serif selection:bg-purple-900 overflow-x-hidden relative"
    >
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 bg-black opacity-30 transition-transform duration-[1000ms] ease-out"
          style={{ transform: `scale(1.1) translate(${(mousePos.x - window.innerWidth/2) * 0.02}px, ${(mousePos.y - window.innerHeight/2) * 0.02}px)` }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05] animate-spin-slow pointer-events-none">
           <svg width="800" height="800" viewBox="0 0 100 100" className="text-amber-500">
              <path fill="currentColor" d="M50 0 L55 45 L100 50 L55 55 L50 100 L45 55 L0 50 L45 45 Z" />
              <circle cx="50" cy="50" r="8" stroke="currentColor" strokeWidth="1" fill="none" />
           </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 p-6 rounded-[2.5rem] flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <Globe className="w-6 h-6 text-blue-400 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-400/50 uppercase tracking-widest">Czas Współczesny</p>
                <h3 className="text-3xl font-mono font-black text-white tracking-tighter">
                  {now.toLocaleTimeString('pl-PL', { hour12: false })}
                </h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/30 uppercase font-bold">{now.toLocaleDateString('pl-PL', { weekday: 'long' })}</p>
              <p className="text-sm font-bold text-white/60">{now.toLocaleDateString('pl-PL')}</p>
            </div>
          </div>

          <div className="bg-amber-900/[0.05] backdrop-blur-3xl border border-amber-500/20 p-6 rounded-[2.5rem] flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Compass className="w-6 h-6 text-amber-500 animate-spin-slow" />
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-500/50 uppercase tracking-widest">Czas Pradawny</p>
                <h3 className="text-3xl font-mono font-black text-white tracking-tighter">
                  {Math.floor(slavicHour)} <span className="text-lg text-amber-500/40">/ 16</span>
                </h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-amber-500/30 uppercase font-bold tracking-widest">Era Gwiezdnej Świątyni</p>
              <p className="text-sm font-bold text-amber-500/80">Rok {slavicDate.year}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-3 space-y-6">
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] flex items-center gap-4 cursor-pointer group" onClick={() => setAudioEnabled(!audioEnabled)}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${audioEnabled ? 'bg-amber-500' : 'bg-white/5 opacity-50'}`}>
                <Zap className={`w-6 h-6 ${audioEnabled ? 'text-black' : 'text-white'}`} />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight leading-none mb-1">ASTRUM</h1>
                <p className="text-[9px] uppercase font-bold tracking-[0.3em] text-white/30">Mistyka Przodków</p>
              </div>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 p-6 rounded-[2rem]">
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                 <ScrollText className="w-3 h-3 text-amber-500" /> Krąg Miesięcy
              </h3>
              <div className="grid grid-cols-1 gap-1.5 max-h-[40vh] overflow-y-auto pr-2 custom-scroll">
                {months.map((m, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setSelectedMonthIdx(idx); setGeminiResponse(""); }}
                    className={`w-full group p-3 rounded-xl transition-all duration-300 border text-left
                      ${selectedMonthIdx === idx 
                        ? 'bg-gradient-to-r from-amber-600/20 to-purple-600/20 border-amber-500' 
                        : 'bg-transparent border-white/5 hover:border-white/10'}`}
                  >
                    <div className="flex justify-between items-center relative z-10">
                      <span className={`text-xs font-bold tracking-widest uppercase ${selectedMonthIdx === idx ? 'text-amber-400' : 'text-white/40'}`}>
                        {m.name}
                      </span>
                      {slavicDate.monthIdx === idx && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-[2rem] bg-gradient-to-br from-indigo-950/40 to-black border border-white/10 relative overflow-hidden">
               <h4 className="text-[9px] font-black text-purple-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                 <MessageSquareQuote className="w-4 h-4" /> Wyrocznia Gwiezdna
               </h4>
               <form onSubmit={askOracle} className="relative z-10 space-y-3">
                 <input 
                   type="text" 
                   value={oracleQuery}
                   onChange={(e) => setOracleQuery(e.target.value)}
                   placeholder="Szepnij pytanie..." 
                   className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                 />
                 <button 
                  type="submit"
                  disabled={geminiLoading}
                  className="w-full py-2.5 bg-purple-600/20 hover:bg-purple-600/40 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] border border-purple-500/30 flex items-center justify-center gap-2"
                 >
                   {geminiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <>Wywołaj Ducha <Sparkles className="w-3 h-3" /></>}
                 </button>
               </form>
            </div>
          </aside>

          <main className="lg:col-span-6 space-y-6">
            <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] shadow-[0_0_80px_rgba(0,0,0,0.4)] relative overflow-hidden">
              <div className="flex justify-between items-center mb-10 relative z-10">
                <div>
                   <h2 className={`text-6xl font-black tracking-tighter uppercase transition-colors duration-1000 ${months[selectedMonthIdx].color}`}>
                    {months[selectedMonthIdx].name}
                  </h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-black italic">{months[selectedMonthIdx].meaning}</span>
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md animate-float">
                  {months[selectedMonthIdx].element === 'Ogień' && <Flame className="w-10 h-10 text-orange-500" />}
                  {months[selectedMonthIdx].element === 'Woda' && <Droplets className="w-10 h-10 text-blue-500" />}
                  {months[selectedMonthIdx].element === 'Ziemia' && <Mountain className="w-10 h-10 text-emerald-500" />}
                  {months[selectedMonthIdx].element === 'Powietrze' && <Wind className="w-10 h-10 text-sky-400" />}
                </div>
              </div>

              <div className="grid grid-cols-9 gap-2.5">
                {weekDays.map(wd => (
                  <div key={wd} className="text-[7px] font-black text-white/20 text-center uppercase mb-4">{wd.substring(0, 3)}</div>
                ))}
                {[...Array(months[selectedMonthIdx].days)].map((_, i) => {
                  const d = i + 1;
                  const isCurrentDay = slavicDate.monthIdx === selectedMonthIdx && slavicDate.day === d;
                  const hasNote = notes[`${months[selectedMonthIdx].name}-${d}`];

                  return (
                    <button
                      key={i}
                      onClick={() => handleDayClick(d)}
                      className={`group relative aspect-square rounded-2xl border transition-all duration-500 flex items-center justify-center
                        ${isCurrentDay 
                          ? 'bg-white text-black border-white shadow-[0_0_40px_rgba(255,255,255,0.4)] scale-110 z-20' 
                          : 'bg-white/[0.02] border-white/5 hover:border-white/30'}`}
                    >
                      <span className="text-xl font-black relative z-10">{d}</span>
                      {hasNote && <div className={`absolute bottom-2 w-1 h-1 rounded-full ${isCurrentDay ? 'bg-black' : 'bg-amber-400'}`} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {geminiResponse && (
              <div className="bg-gradient-to-br from-white/10 to-transparent backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] relative">
                <h3 className="text-[10px] font-black text-amber-500 uppercase mb-4">Głos z Gwiezdnej Świątyni</h3>
                <p className="text-sm leading-relaxed text-white/90 italic font-serif">{geminiResponse}</p>
                <button onClick={() => setGeminiResponse("")} className="absolute top-6 right-6 text-white/20">✕</button>
              </div>
            )}
          </main>

          <aside className="lg:col-span-3 space-y-6">
            <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-6 rounded-[2.5rem] min-h-[500px] flex flex-col relative overflow-hidden group">
              <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <Star className="w-4 h-4" /> Kronika astralna
              </h3>

              {selectedDay ? (
                <div className="flex-grow flex flex-col space-y-5 relative z-10">
                  <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
                    <div className="text-4xl font-black text-white">{selectedDay} <span className="text-amber-500/40">{months[selectedMonthIdx].name}</span></div>
                  </div>

                  <button 
                    onClick={interpretDay}
                    disabled={geminiLoading}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-[0.4em] rounded-2xl border border-white/10 flex items-center justify-center gap-2"
                  >
                    {geminiLoading ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <>Przeniknij Zasłonę <ChevronRight className="w-3 h-3" /></>}
                  </button>

                  <div className="flex-grow flex flex-col">
                     <textarea
                      value={notes[`${months[selectedMonthIdx].name}-${selectedDay}`] || ''}
                      onChange={(e) => {
                        const key = `${months[selectedMonthIdx].name}-${selectedDay}`;
                        const newNotes = { ...notes, [key]: e.target.value };
                        setNotes(newNotes);
                        localStorage.setItem('slavic_mystic_notes', JSON.stringify(newNotes));
                      }}
                      className="w-full flex-grow bg-black/60 border border-white/5 rounded-3xl p-5 text-sm text-white/80 outline-none resize-none"
                      placeholder="Co mówi Ci dzisiaj Twój ród?"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-8 opacity-20">
                  <BrainCircuit className="w-20 h-20 text-white mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.5em]">Wybierz punkt czasu</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 180s linear infinite; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .custom-scroll::-webkit-scrollbar { width: 3px; }
      `}</style>
    </div>
  );
};

export default SlavicCalendar;
