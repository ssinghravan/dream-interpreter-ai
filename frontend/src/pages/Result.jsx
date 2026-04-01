import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookMarked, Share2, RotateCcw, Copy, Download, MessageCircle, Check, Image } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import { saveDream } from '../services/api';
import StarField from '../components/StarField';

// ─── Helpers ─────────────────────────────────────────────────
const moodClass = (mood) => {
  const m = mood?.toLowerCase();
  if (m?.includes('dread') || m?.includes('anxi') || m?.includes('fear')) return 'mood-anxiety';
  if (m?.includes('hope') || m?.includes('joy')  || m?.includes('happy')) return 'mood-hope';
  if (m?.includes('joy')  || m?.includes('euph'))                          return 'mood-joy';
  if (m?.includes('conf') || m?.includes('lost'))                          return 'mood-confusion';
  if (m?.includes('peac') || m?.includes('calm') || m?.includes('seren'))  return 'mood-peace';
  if (m?.includes('sad')  || m?.includes('melan'))                         return 'mood-fear';
  return 'mood-default';
};

const moodEmoji = (mood) => {
  const m = mood?.toLowerCase();
  if (m?.includes('anxi'))  return '😰';
  if (m?.includes('hope'))  return '🌟';
  if (m?.includes('dread') || m?.includes('fear')) return '😨';
  if (m?.includes('joy')  || m?.includes('happy')) return '😊';
  if (m?.includes('conf'))  return '😵';
  if (m?.includes('peac'))  return '😌';
  if (m?.includes('sad'))   return '😢';
  return '🌙';
};

/** Deterministic confidence score seeded from dream text length + mood length */
const fakeConfidence = (dreamText, mood) => {
  const seed = (dreamText?.length || 50) + (mood?.length || 5);
  return Math.min(99, Math.max(78, 72 + (seed % 28)));
};

/** Build a simple, fast Pollinations.ai image URL */
function buildImageUrl(dreamText) {
  const snippet = dreamText.slice(0, 60).replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
  const prompt  = `simple surreal dream ${snippet}`;
  const seed    = Math.floor(Math.random() * 999999);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=512&nologo=true&seed=${seed}`;
}

/** localStorage cache key for a given dream */
const cacheKey = (dreamText) => `dream_img_${btoa(dreamText.slice(0, 80)).replace(/=/g, '')}`;

// ─── Card animation variant ───────────────────────────────────
const card = {
  hidden:  { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ─── Dream Image component (on-demand) ───────────────────────
function DreamImage({ dreamText, initialImageUrl }) {
  // imageUrl = URL we hand to <img>; null = not yet requested
  const [imageUrl,    setImageUrl]    = useState(null);
  const [imgState,    setImgState]    = useState('idle');  // idle | loading | loaded | error
  const [slowWarning, setSlowWarning] = useState(false);

  const slowTimerRef = useRef(null);

  // On mount: check cache first; if a backend imageUrl was passed and
  // the cache has it, restore it silently.
  useEffect(() => {
    const cached = localStorage.getItem(cacheKey(dreamText));
    if (cached) {
      setImageUrl(cached);
      setImgState('loading'); // will flip to 'loaded' once <img> fires onLoad
    }
  }, [dreamText]);

  const handleGenerate = useCallback(() => {
    // Clear any previous slow-warning timer
    clearTimeout(slowTimerRef.current);
    setSlowWarning(false);

    const url = buildImageUrl(dreamText);
    setImageUrl(url);
    setImgState('loading');

    slowTimerRef.current = setTimeout(() => setSlowWarning(true), 5000);
  }, [dreamText]);

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(slowTimerRef.current), []);

  const handleLoad = () => {
    clearTimeout(slowTimerRef.current);
    setSlowWarning(false);
    setImgState('loaded');
    // Persist to cache
    if (imageUrl) localStorage.setItem(cacheKey(dreamText), imageUrl);
  };

  const handleError = () => {
    clearTimeout(slowTimerRef.current);
    setSlowWarning(false);
    setImgState('error');
  };

  return (
    <motion.div
      variants={card} initial="hidden" animate="visible"
      className="w-full mb-8"
    >
      {/* ── Idle state: show CTA button ── */}
      {imgState === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col items-center justify-center gap-4 py-10 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(59,130,246,0.04))',
            border: '1px dashed rgba(124,58,237,0.25)',
          }}
        >
          <div className="text-4xl opacity-60">🎨</div>
          <p className="text-slate-500 text-sm text-center max-w-xs">
            Visualize your dream as AI-generated surreal art
          </p>
          <motion.button
            onClick={handleGenerate}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              boxShadow: '0 0 20px rgba(124,58,237,0.35)',
            }}
          >
            <Image size={16} />
            Generate Dream Image
          </motion.button>
        </motion.div>
      )}

      {/* ── Loading / loaded state ── */}
      {imgState !== 'idle' && (
        <div
          className="w-full rounded-2xl overflow-hidden border border-white/[0.08]"
          style={{ boxShadow: '0 0 60px rgba(124,58,237,0.2)' }}
        >
          {/* Skeleton / loading state */}
          {imgState === 'loading' && (
            <div
              className="w-full flex flex-col items-center justify-center gap-3 py-16"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(59,130,246,0.05))',
                minHeight: '280px',
              }}
            >
              {/* Skeleton shimmer */}
              <div
                className="w-full absolute inset-0 rounded-2xl"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.06) 50%, transparent 100%)',
                  animation: 'shimmer 1.8s infinite',
                }}
              />
              <div className="w-10 h-10 border-2 border-purple-600/40 border-t-purple-400 rounded-full animate-spin" />
              <p className="text-slate-400 text-sm animate-pulse">🎨 Generating dream visualization…</p>

              {/* 5-second slow warning */}
              <AnimatePresence>
                {slowWarning && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-slate-600 text-xs text-center px-6"
                  >
                    Image generation is taking longer than expected…<br />
                    <span className="text-slate-700">Hang tight, almost there ✨</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Actual image (hidden until loaded) */}
          {imgState !== 'error' && imageUrl && (
            <img
              src={imageUrl}
              alt="AI-generated dream visualization"
              className="w-full object-cover transition-opacity duration-700"
              referrerPolicy="no-referrer"
              style={{
                minHeight: imgState === 'loaded' ? '280px' : '0',
                maxHeight: '500px',
                display:   imgState === 'loaded' ? 'block' : 'none',
              }}
              onLoad={handleLoad}
              onError={handleError}
            />
          )}

          {/* Error state */}
          {imgState === 'error' && (
            <div
              className="w-full flex flex-col items-center justify-center gap-2 py-12"
              style={{ background: 'rgba(124,58,237,0.05)', minHeight: '160px' }}
            >
              <span className="text-3xl">🌙</span>
              <p className="text-slate-600 text-sm">Visualization could not be generated</p>
              <button
                onClick={handleGenerate}
                className="text-purple-500 text-xs hover:text-purple-300 transition-colors underline mt-1"
              >
                Try again ↺
              </button>
            </div>
          )}

          {/* Footer caption */}
          {imgState !== 'loading' && (
            <div className="px-4 py-2.5 text-xs text-slate-600 flex items-center justify-between"
              style={{ background: 'rgba(0,0,0,0.4)' }}>
              <span>🎨 AI-generated dream visualization by Pollinations.ai</span>
              {imgState === 'loaded' && (
                <button
                  onClick={handleGenerate}
                  className="text-purple-600 hover:text-purple-400 transition-colors text-xs"
                  title="Regenerate image"
                >
                  ↺ Regenerate
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Result Page ─────────────────────────────────────────
export default function Result() {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const hasSaved  = useRef(false);
  const cardRef   = useRef(null);
  const shareRef  = useRef(null);
  const [shareOpen,   setShareOpen]   = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!state?.analysis) navigate('/');
  }, [state, navigate]);

  // Close share dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (shareRef.current && !shareRef.current.contains(e.target)) setShareOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!state?.analysis) return null;

  const { dreamText, analysis } = state;
  const { meaning, symbols, mood } = analysis;
  const confidence = fakeConfidence(dreamText, mood);

  const handleSave = async () => {
    try {
      // imageUrl stored in cache if generated, else empty
      const cachedImg = localStorage.getItem(cacheKey(dreamText)) || '';
      await saveDream({ text: dreamText, meaning, symbols, mood, confidence, imageUrl: cachedImg });
      toast.success('Dream saved successfully 🌙');
      hasSaved.current = true;
    } catch {
      toast.error('Failed to save dream. Are you connected?');
    }
  };

  // ── Share handlers ──────────────────────────────────────────
  const shareText = `🌙 Dream Analysis\n\nDream: ${dreamText}\n\nMeaning: ${meaning}\n\nMood: ${mood}\n\nAnalyzed by Dream Interpreter AI 🔮`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    toast.success('Analysis copied to clipboard! 📋');
    setTimeout(() => setCopied(false), 2500);
    setShareOpen(false);
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setShareOpen(false);
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    setShareOpen(false);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#03070e',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `dream-analysis-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Image downloaded! 🖼️');
    } catch {
      toast.error('Download failed. Try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="relative min-h-screen pt-24 pb-20 overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at top, #1a1a2e 0%, #000 70%)' }}>
      <StarField />

      {/* Ambient glow blobs — keep existing, add second for depth */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-700/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/5 w-72 h-72 bg-blue-800/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-6">

        {/* Back button */}
        <motion.button onClick={() => navigate('/')}
          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors duration-200 text-sm hover:scale-105 transition-transform">
          <ArrowLeft size={16} /> Back to Home
        </motion.button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }} className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Your Dream <span className="gradient-text">Decoded</span>
          </h1>
          <p className="text-slate-500 text-sm italic">
            "{dreamText.slice(0, 100)}{dreamText.length > 100 ? '…' : ''}"
          </p>
        </motion.div>

      <div ref={cardRef}>
        {/* Dream Image — on-demand */}
        <DreamImage dreamText={dreamText} initialImageUrl={analysis.imageUrl} />

        {/* ── Mood + Meaning row ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">

          {/* Emotional State card */}
          <motion.div
            variants={card} initial="hidden" animate="visible"
            transition={{ delay: 0.15 }}
            className="glass p-5 flex flex-col items-center text-center"
            style={{ boxShadow: '0 0 24px rgba(124,58,237,0.08)' }}
          >
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-3">Emotional State</p>
            <span className="text-5xl mb-3">{moodEmoji(mood)}</span>
            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${moodClass(mood)}`}>
              {mood}
            </span>
            {/* ── Confidence Score ── */}
            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-green-400 font-semibold text-sm">Confidence: {confidence}%</span>
            </div>
            <div className="mt-2 w-full max-w-[120px] h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${confidence}%` }}
                transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
                style={{ background: 'linear-gradient(90deg, #22c55e, #86efac)' }}
              />
            </div>
          </motion.div>

          {/* Psychological Meaning card */}
          <motion.div
            variants={card} initial="hidden" animate="visible"
            transition={{ delay: 0.25 }}
            className="glass p-5 md:col-span-2"
            style={{ boxShadow: '0 0 24px rgba(124,58,237,0.08)' }}
          >
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-3">Psychological Meaning</p>
            <p className="text-slate-200 leading-relaxed text-sm">{meaning}</p>
          </motion.div>
        </div>

        {/* ── Dream Symbols ── */}
        <motion.div
          variants={card} initial="hidden" animate="visible"
          transition={{ delay: 0.35 }}
          className="glass p-6 mb-6"
          style={{ boxShadow: '0 0 24px rgba(124,58,237,0.08)' }}
        >
          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-4">Dream Symbols</p>

          {/* Pill badges row */}
          <div className="flex flex-wrap gap-2 mb-4">
            {symbols?.map((sym, i) => (
              <motion.span
                key={`badge-${i}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.07 }}
                className="px-3 py-1 rounded-full text-sm font-medium text-purple-300 cursor-default"
                style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(168,85,247,0.3)' }}
              >
                {sym.name}
              </motion.span>
            ))}
          </div>

          {/* Detailed symbol cards — unchanged structure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {symbols?.map((sym, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.08, duration: 0.5 }}
                className="flex gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}
              >
                <span className="text-purple-400 font-bold text-sm mt-0.5 shrink-0">{sym.name}</span>
                <span className="text-slate-400 text-sm leading-snug">— {sym.meaning}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div> {/* end cardRef */}

        {/* ── Action buttons ── */}
        <motion.div
          variants={card} initial="hidden" animate="visible"
          transition={{ delay: 0.5 }}
          className="flex flex-wrap gap-3 items-center"
        >
          {/* Save to Journal */}
          <motion.button
            onClick={handleSave}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 text-sm py-2.5 px-5 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #a855f7, #ec4899)',
              boxShadow: '0 0 20px rgba(168,85,247,0.35)',
            }}
          >
            <BookMarked size={16} /> Save to Journal
          </motion.button>

          {/* Share — dropdown trigger */}
          <div className="relative" ref={shareRef}>
            <motion.button
              onClick={() => setShareOpen(o => !o)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg ${
                shareOpen ? 'text-white shadow-purple-500/30' : 'text-slate-300 hover:text-white hover:shadow-purple-500/30'
              }`}
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${ shareOpen ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.1)'}` }}
            >
              <Share2 size={16} /> Share Analysis
            </motion.button>

            {/* Dropdown panel */}
            <AnimatePresence>
              {shareOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  className="absolute bottom-full mb-2 left-0 min-w-[210px] rounded-2xl overflow-hidden z-30"
                  style={{
                    background: 'rgba(15,15,30,0.95)',
                    border: '1px solid rgba(168,85,247,0.2)',
                    boxShadow: '0 0 40px rgba(124,58,237,0.2), 0 8px 32px rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  <p className="text-slate-600 text-xs px-4 pt-3 pb-2 uppercase tracking-widest">Share via</p>

                  {/* Copy */}
                  <button onClick={handleCopy}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/[0.04] transition-all">
                    {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-purple-400" />}
                    <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                  </button>

                  {/* WhatsApp */}
                  <button onClick={handleWhatsApp}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/[0.04] transition-all">
                    <MessageCircle size={16} className="text-green-400" />
                    <span>Share on WhatsApp</span>
                  </button>

                  {/* Download */}
                  <button onClick={handleDownload} disabled={downloading}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/[0.04] transition-all border-t border-white/[0.05] disabled:opacity-50">
                    {downloading
                      ? <><div className="w-4 h-4 border-2 border-slate-500 border-t-purple-400 rounded-full animate-spin" /><span>Generating…</span></>
                      : <><Download size={16} className="text-blue-400" /><span>Download as Image</span></>}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Analyze Another Dream */}
          <motion.button
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-all duration-300"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <RotateCcw size={15} /> Analyze Another Dream
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
