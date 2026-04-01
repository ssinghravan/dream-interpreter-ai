import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sparkles, Mic, MicOff, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { analyzeDream } from '../services/api';
import StarField from '../components/StarField';

const EXAMPLES = [
  'I was flying over a dark ocean when the sky turned red',
  'My teeth kept falling out and I couldn\'t stop it',
  'I was being chased through an endless dark forest',
  'I found a hidden door in my childhood home',
];

// ─── Loading Overlay ──────────────────────────────────────────
function AnalyzingOverlay() {
  const phases = [
    '🌙 Analyzing your dream…',
    '🔮 Extracting hidden symbols…',
    '🧠 Decoding your subconscious…',
  ];
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPhase(p => (p + 1) % phases.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(18px)' }}
    >
      {/* Pulsing orb */}
      <div className="relative mb-10">
        <div className="w-24 h-24 rounded-full animate-pulse"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.6) 0%, rgba(124,58,237,0.2) 60%, transparent 100%)' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Moon size={36} className="text-purple-300" />
        </div>
        {/* Rotating ring */}
        <div className="absolute -inset-3 rounded-full border-2 border-transparent"
          style={{ borderTopColor: 'rgba(168,85,247,0.7)', animation: 'spin 1.4s linear infinite' }} />
      </div>

      {/* Animated phase text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={phase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35 }}
          className="text-white text-xl font-semibold text-center animate-pulse"
        >
          {phases[phase]}
        </motion.p>
      </AnimatePresence>

      <p className="text-slate-600 text-sm mt-3">This takes about 10–15 seconds</p>

      {/* Progress dots */}
      <div className="flex gap-2 mt-8">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [text, setText]           = useState('');
  const [loading, setLoading]     = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef            = useRef(null);
  const navigate                  = useNavigate();

  // Setup Web Speech API
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return; // handled in toggleVoice via ref check

    const recognition = new SR();
    recognition.continuous     = true;
    recognition.interimResults = true;
    recognition.lang           = 'en-US';

    recognition.onresult = (e) => {
      let t = '';
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setText(t);
    };

    recognition.onend = () => setListening(false);

    // ── Error handling ──────────────────────────────────────
    recognition.onerror = (e) => {
      setListening(false);
      switch (e.error) {
        case 'not-allowed':
        case 'permission-denied':
          toast.error(
            '🎤 Microphone permission denied.\n\nClick the 🔒 lock icon in your browser address bar → Allow microphone.',
            { duration: 6000 }
          );
          break;
        case 'no-speech':
          toast('No speech detected. Try again.', { icon: '🎙️' });
          break;
        case 'network':
          toast.error('Network error during voice recognition.');
          break;
        case 'audio-capture':
          toast.error('No microphone found. Please connect a microphone.');
          break;
        default:
          toast.error(`Voice error: ${e.error}`);
      }
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      toast.error(
        '🎤 Voice input not supported in this browser.\n\nPlease use Chrome or Edge for voice input.',
        { duration: 5000 }
      );
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setListening(true);
        toast.success('🎙️ Listening… speak your dream');
      } catch (err) {
        // start() can throw if already running or permission denied immediately
        if (err.name === 'InvalidStateError') {
          // Already started — just sync state
          setListening(true);
        } else {
          setListening(false);
          toast.error(`Could not start mic: ${err.message}`);
        }
      }
    }
  };

  const handleAnalyze = async () => {
    if (!text.trim() || text.trim().length < 5)
      return toast.error('Please describe your dream (at least 5 characters)');

    setLoading(true);
    try {
      const result = await analyzeDream(text.trim());
      navigate('/result', { state: { dreamText: text.trim(), analysis: result } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at top, #1a1a2e 0%, #000 70%)' }}>
      <StarField />

      {/* Loading overlay */}
      <AnimatePresence>
        {loading && <AnalyzingOverlay />}
      </AnimatePresence>

      {/* Background orbs */}
      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-purple-700/20 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-blue-700/15 rounded-full blur-3xl animate-pulse-slow pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-3xl mx-auto px-6 pt-32 pb-20 text-center">

        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-8 text-purple-300"
          style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}>
          <Sparkles size={13} /> AI-Powered Dream Psychology
        </motion.div>

        {/* Title */}
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black leading-tight mb-5">
          <span className="text-white">Decode Your</span>
          <br />
          <span className="gradient-text">Dreams</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          className="text-slate-400 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
          Enter your dream and our AI psychologist will reveal its hidden meaning,
          symbols, and emotional patterns.
        </motion.p>

        {/* Dream Input */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className={`relative rounded-2xl transition-all duration-300 ${
            listening
              ? 'shadow-[0_0_40px_rgba(239,68,68,0.2)] border border-red-500/40'
              : 'border border-white/[0.08] focus-within:border-purple-500/40 focus-within:shadow-[0_0_40px_rgba(124,58,237,0.12)]'
          }`} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe your dream in detail… I was standing in a dark room when suddenly the walls started closing in and I felt..."
              className="w-full h-44 bg-transparent text-white placeholder-slate-600 p-5 pr-14 rounded-2xl resize-none outline-none text-base leading-relaxed"
              maxLength={3000}
            />

            {/* Voice btn */}
            <button onClick={toggleVoice}
              title={listening ? 'Stop listening' : 'Speak your dream'}
              className={`absolute top-4 right-4 p-2.5 rounded-xl transition-all duration-300 ${
                listening
                  ? 'bg-red-500/20 text-red-400 shadow-[0_0_18px_rgba(239,68,68,0.35)]'
                  : 'bg-white/5 text-slate-500 hover:text-purple-400 hover:bg-white/10 hover:shadow-[0_0_12px_rgba(168,85,247,0.2)]'
              }`}>
              {/* Pulse ring when listening */}
              {listening && (
                <span className="absolute inset-0 rounded-xl animate-ping"
                  style={{ background: 'rgba(239,68,68,0.15)' }} />
              )}
              {listening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Char count — shifted left of mic when listening */}
            <span className="absolute bottom-4 right-4 text-xs text-slate-700">{text.length}/3000</span>
          </div>

          {/* Listening indicator pill */}
          <AnimatePresence>
            {listening && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="flex items-center justify-center gap-2 mt-3 py-2 px-4 rounded-full mx-auto w-fit"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                {/* Animated sound bars */}
                <div className="flex items-center gap-0.5">
                  {[0.4, 0.8, 0.55, 1, 0.65].map((h, i) => (
                    <div key={i}
                      className="w-0.5 bg-red-400 rounded-full animate-bounce"
                      style={{ height: `${h * 14}px`, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-red-400">Listening… speak your dream</span>
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analyze button — enhanced with gradient purple→pink + glow */}
          <motion.button
            onClick={handleAnalyze}
            disabled={loading || text.trim().length < 5}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full mt-4 flex items-center justify-center gap-2 text-base py-3.5 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #a855f7, #ec4899)',
              boxShadow: text.trim().length >= 5 ? '0 0 30px rgba(168,85,247,0.4)' : 'none',
            }}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Moon size={18} />
                Analyze Dream
                <ChevronRight size={18} />
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Example prompts */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="mt-10">
          <p className="text-slate-600 text-xs mb-3">Try an example:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => setText(ex)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-purple-300 hover:scale-105 transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                "{ex.slice(0, 38)}…"
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Feature cards */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { icon: '🧠', title: 'Deep Analysis',     desc: 'Jungian & Freudian psychological interpretation of your dream' },
          { icon: '🔮', title: 'Symbol Extraction', desc: 'Identify hidden symbols and archetypes in your subconscious' },
          { icon: '📊', title: 'Mood Tracking',     desc: 'Track emotional patterns across all your dreams over time' },
        ].map((f, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }} viewport={{ once: true }}
            className="glass glass-hover p-6 text-left">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold text-white mb-1.5">{f.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
