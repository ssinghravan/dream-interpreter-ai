import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, Moon } from 'lucide-react';
import StarField from '../components/StarField';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden text-center px-6">
      <StarField />

      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-700/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-md"
      >
        {/* Moon icon with glow */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          className="flex justify-center mb-6"
        >
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, rgba(124,58,237,0.1) 60%, transparent 100%)' }}>
            <Moon size={40} className="text-purple-300" />
          </div>
        </motion.div>

        <h1 className="text-7xl font-black text-white mb-2">404</h1>
        <p className="text-2xl font-bold gradient-text mb-3">Lost in a Dream</p>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          This page doesn't exist in your waking world.<br />
          Perhaps you dreamed it into existence?
        </p>

        <motion.button
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            boxShadow: '0 0 24px rgba(168,85,247,0.35)',
          }}
        >
          <Home size={16} /> Back to Home
        </motion.button>
      </motion.div>
    </div>
  );
}
