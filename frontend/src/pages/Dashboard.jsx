import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, TrendingUp, Moon, RefreshCcw } from 'lucide-react';
import { getDreams, getMoodStats, getInsights } from '../services/api';
import StarField from '../components/StarField';
import toast from 'react-hot-toast';
import {
  LineChart, Line,
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

// Mood → numeric sentiment score for chart
const moodScore = (mood = '') => {
  const m = mood.toLowerCase();
  if (m.includes('joy')  || m.includes('hope')  || m.includes('peace')) return 8;
  if (m.includes('calm') || m.includes('seren'))                         return 7;
  if (m.includes('conf') || m.includes('curio'))                         return 5;
  if (m.includes('anxi') || m.includes('sad')  || m.includes('melan'))   return 3;
  if (m.includes('fear') || m.includes('dread') || m.includes('terr'))   return 2;
  return 5;
};

const moodEmoji = (mood = '') => {
  const m = mood.toLowerCase();
  if (m.includes('anxi'))  return '😰';
  if (m.includes('hope'))  return '🌟';
  if (m.includes('fear') || m.includes('dread')) return '😨';
  if (m.includes('joy')  || m.includes('happy')) return '😊';
  if (m.includes('conf'))  return '😵';
  if (m.includes('peac'))  return '😌';
  if (m.includes('sad'))   return '😢';
  return '🌙';
};

const card = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass px-4 py-2.5 text-xs">
        <p className="text-slate-400 mb-1">{label}</p>
        <p className="text-purple-300 font-semibold">Mood score: {payload[0].value}/10</p>
      </div>
    );
  }
  return null;
};

// Mood colour palette
const MOOD_COLORS = [
  '#a855f7', '#818cf8', '#38bdf8', '#34d399', '#fb923c',
  '#f472b6', '#facc15', '#e879f9', '#4ade80', '#60a5fa',
];

// Custom bar chart tooltip
const MoodTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="glass px-4 py-2.5 text-xs">
        <p className="text-purple-300 font-semibold">{payload[0].payload.mood}</p>
        <p className="text-slate-400">{payload[0].value} dream{payload[0].value !== 1 ? 's' : ''}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [dreams,    setDreams]    = useState([]);
  const [moodStats, setMoodStats] = useState([]);
  const [insight,   setInsight]   = useState(null);   // { insight, dominantMood, topSymbols, dreamCount }
  const [loading,   setLoading]   = useState(true);
  const [insightLoading, setInsightLoading] = useState(true);

  const fetchDreams = async () => {
    setLoading(true);
    setInsightLoading(true);
    try {
      const [data, stats, insightData] = await Promise.all([
        getDreams(),
        getMoodStats(),
        getInsights(),
      ]);
      setDreams(data);
      setMoodStats(
        Object.entries(stats)
          .map(([mood, count]) => ({ mood, count }))
          .sort((a, b) => b.count - a.count)
      );
      if (insightData?.insight) setInsight(insightData);
    } catch {
      toast.error('Could not load dreams. Is the backend running?');
    } finally {
      setLoading(false);
      setInsightLoading(false);
    }
  };

  useEffect(() => { fetchDreams(); }, []);

  // Chart data — last 10 dreams
  const chartData = [...dreams]
    .slice(0, 10)
    .reverse()
    .map((d, i) => ({
      name:  new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: moodScore(d.mood),
    }));

  const avgMood = dreams.length
    ? (dreams.reduce((sum, d) => sum + moodScore(d.mood), 0) / dreams.length).toFixed(1)
    : '—';

  return (
    <div className="relative min-h-screen pt-24 pb-20 overflow-hidden">
      <StarField />
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-purple-700/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Dream <span className="gradient-text">Journal</span>
          </h1>
          <p className="text-slate-500 text-sm">Your subconscious patterns, decoded over time.</p>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Dreams',   value: dreams.length,       icon: <Moon size={18} className="text-purple-400" /> },
            { label: 'Avg Mood Score', value: `${avgMood}/10`,      icon: <TrendingUp size={18} className="text-green-400" /> },
            { label: 'This Month',     value: dreams.filter(d => new Date(d.createdAt).getMonth() === new Date().getMonth()).length, icon: <BookOpen size={18} className="text-blue-400" /> },
            { label: 'Unique Moods',   value: new Set(dreams.map(d => d.mood)).size, icon: '🎭' },
          ].map((s, i) => (
            <motion.div key={i}
              variants={card} initial="hidden" animate="visible" transition={{ delay: i * 0.08 }}
              className="glass p-4 text-center">
              <div className="flex justify-center mb-2">{typeof s.icon === 'string' ? <span className="text-xl">{s.icon}</span> : s.icon}</div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Smart AI Insights Card ── */}
        {(insightLoading || insight) && (
          <motion.div variants={card} initial="hidden" animate="visible" transition={{ delay: 0.32 }}
            className="glass mb-8 relative overflow-hidden"
            style={{ border: '1px solid rgba(168,85,247,0.2)' }}>

            {/* Top gradient bar */}
            <div className="h-0.5 w-full"
              style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7, #38bdf8, transparent)' }} />

            {/* Radial glow */}
            <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)' }} />

            <div className="p-6">
              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
                    <span className="text-base">🔮</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">Smart AI Insight</p>
                    <p className="text-slate-600 text-xs">Powered by Groq · Llama 3.3</p>
                  </div>
                </div>
                {insight?.dominantMood && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium text-purple-300"
                    style={{ background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(168,85,247,0.3)' }}>
                    {moodEmoji(insight.dominantMood)} {insight.dominantMood} dominant
                  </span>
                )}
              </div>

              {/* Insight body */}
              {insightLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-3 rounded-full bg-white/[0.06] w-full" />
                  <div className="h-3 rounded-full bg-white/[0.06] w-5/6" />
                  <div className="h-3 rounded-full bg-white/[0.06] w-4/6" />
                </div>
              ) : (
                <blockquote className="relative pl-4 border-l-2 border-purple-500/40">
                  <p className="text-slate-300 text-sm leading-relaxed italic">
                    “{insight?.insight}”
                  </p>
                </blockquote>
              )}

              {/* Top symbols */}
              {!insightLoading && insight?.topSymbols?.length > 0 && (
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <span className="text-slate-600 text-xs">Recurring symbols:</span>
                  {insight.topSymbols.map((sym, i) => (
                    <span key={i}
                      className="px-2 py-0.5 rounded-full text-xs text-purple-300"
                      style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
                      {sym}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer */}
              {!insightLoading && insight && (
                <p className="mt-3 text-slate-700 text-xs">
                  Based on your last {insight.dreamCount} dream{insight.dreamCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Mood chart */}
        {chartData.length > 1 && (
          <motion.div variants={card} initial="hidden" animate="visible" transition={{ delay: 0.35 }}
            className="glass p-6 mb-8">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-5">Mood Trend (last 10 dreams)</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" stroke="#a855f7"
                  strokeWidth={2.5} dot={{ fill: '#a855f7', r: 4 }}
                  activeDot={{ r: 6, fill: '#c084fc' }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* ── Mood Distribution – Premium Redesign ── */}
        {moodStats.length > 0 && (() => {
          const total = moodStats.reduce((s, m) => s + m.count, 0);
          const dominant = moodStats[0];
          return (
            <motion.div variants={card} initial="hidden" animate="visible" transition={{ delay: 0.42 }}
              className="glass p-6 mb-8 relative overflow-hidden">

              {/* Subtle background glow */}
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${MOOD_COLORS[0]}22 0%, transparent 70%)` }} />

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-1">
                    Mood Distribution
                  </p>
                  <p className="text-slate-600 text-xs">{total} dream{total !== 1 ? 's' : ''} analyzed</p>
                </div>
                {/* Dominant mood badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ background: `${MOOD_COLORS[0]}18`, border: `1px solid ${MOOD_COLORS[0]}40` }}>
                  <span className="text-sm">{moodEmoji(dominant.mood)}</span>
                  <span className="text-xs font-semibold" style={{ color: MOOD_COLORS[0] }}>
                    {dominant.mood}
                  </span>
                  <span className="text-xs text-slate-500">dominant</span>
                </div>
              </div>

              {/* Horizontal bars */}
              <div className="space-y-4">
                {moodStats.map((m, i) => {
                  const pct = Math.round((m.count / total) * 100);
                  const color = MOOD_COLORS[i % MOOD_COLORS.length];
                  return (
                    <div key={m.mood}>
                      {/* Label row */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base leading-none">{moodEmoji(m.mood)}</span>
                          <span className="text-sm font-medium text-slate-300">{m.mood}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold tabular-nums" style={{ color }}>{pct}%</span>
                          <span className="text-xs text-slate-600 w-16 text-right">
                            {m.count} dream{m.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Progress track */}
                      <div className="relative h-2.5 rounded-full overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <motion.div
                          className="absolute inset-y-0 left-0 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.9, delay: 0.5 + i * 0.1, ease: 'easeOut' }}
                          style={{
                            background: `linear-gradient(90deg, ${color}99, ${color})`,
                            boxShadow: `0 0 10px ${color}60`,
                          }}
                        />
                        {/* Trailing glow dot */}
                        <motion.div
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                          initial={{ left: 0, opacity: 0 }}
                          animate={{ left: `calc(${pct}% - 6px)`, opacity: 1 }}
                          transition={{ duration: 0.9, delay: 0.5 + i * 0.1, ease: 'easeOut' }}
                          style={{
                            background: color,
                            boxShadow: `0 0 8px ${color}, 0 0 16px ${color}80`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Divider + mini legend row */}
              <div className="mt-5 pt-4 border-t border-white/[0.06] flex flex-wrap gap-2">
                {moodStats.map((m, i) => (
                  <span key={m.mood}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: `${MOOD_COLORS[i % MOOD_COLORS.length]}14`,
                      border: `1px solid ${MOOD_COLORS[i % MOOD_COLORS.length]}35`,
                      color: MOOD_COLORS[i % MOOD_COLORS.length],
                    }}>
                    <span className="w-1.5 h-1.5 rounded-full"
                      style={{ background: MOOD_COLORS[i % MOOD_COLORS.length],
                               boxShadow: `0 0 4px ${MOOD_COLORS[i % MOOD_COLORS.length]}` }} />
                    {m.mood}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })()}

        {/* Dream list */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Dream History</h2>
          <button onClick={fetchDreams}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-purple-300 transition-colors">
            <RefreshCcw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-500">
            <div className="w-8 h-8 border-2 border-purple-600/40 border-t-purple-500 rounded-full animate-spin mr-3" />
            Loading dreams…
          </div>
        ) : dreams.length === 0 ? (
          <motion.div variants={card} initial="hidden" animate="visible"
            className="glass p-12 text-center">
            <div className="text-5xl mb-4">🌙</div>
            <p className="text-slate-400 text-lg font-medium mb-2">No dreams saved yet</p>
            <p className="text-slate-600 text-sm">Analyze your first dream to start your journal.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {dreams.map((dream, i) => (
              <motion.div key={dream._id}
                variants={card} initial="hidden" animate="visible" transition={{ delay: i * 0.06 }}
                className="glass glass-hover p-5 flex gap-4">

                {/* Image thumbnail */}
                {dream.imageUrl && (
                  <div className="shrink-0 w-24 h-20 rounded-xl overflow-hidden border border-white/[0.08]">
                    <img
                      src={dream.imageUrl}
                      alt="dream"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-slate-300 text-sm leading-relaxed line-clamp-2 flex-1">
                      {dream.text}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Mood badge */}
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium text-purple-300"
                        style={{ background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(168,85,247,0.3)' }}>
                        {moodEmoji(dream.mood)} {dream.mood}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-500 text-xs leading-relaxed mb-3 line-clamp-2">
                    {dream.meaning}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {dream.symbols?.slice(0, 3).map((sym, j) => (
                        <span key={j}
                          className="px-2 py-0.5 rounded-full text-xs text-purple-300"
                          style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
                          {sym.name}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-slate-600 shrink-0">
                      {new Date(dream.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
