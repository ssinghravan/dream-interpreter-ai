import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Moon, LayoutDashboard, Home } from 'lucide-react';

export default function Navbar() {
  const { pathname } = useLocation();

  const links = [
    { to: '/',          label: 'Home',      icon: <Home size={15} /> },
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3.5"
      style={{
        background: 'rgba(3,7,18,0.80)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 1px 40px rgba(0,0,0,0.4)',
      }}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 font-bold text-base sm:text-lg tracking-tight group">
        <motion.div whileHover={{ rotate: 15 }} transition={{ duration: 0.3 }}>
          <Moon size={20} className="text-purple-400" />
        </motion.div>
        <span className="gradient-text">Dream Interpreter</span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {links.map(({ to, label, icon }) => {
          const isActive = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              {/* Active background */}
              {isActive && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(168,85,247,0.3)' }}
                  transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
