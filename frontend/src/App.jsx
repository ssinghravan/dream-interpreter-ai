import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Navbar    from './components/Navbar';
import Home      from './pages/Home';
import Result    from './pages/Result';
import Dashboard from './pages/Dashboard';
import NotFound  from './pages/NotFound';

// Scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}

// Smooth page transition wrapper
const pageVariants = {
  initial:  { opacity: 0, y: 12 },
  animate:  { opacity: 1, y: 0,  transition: { duration: 0.35, ease: 'easeOut' } },
  exit:     { opacity: 0, y: -8, transition: { duration: 0.2,  ease: 'easeIn'  } },
};

function PageWrapper({ children }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <>
      <ScrollToTop />
      <Navbar />

      {/* Global toast — single instance here, not per-page */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'rgba(15,10,30,0.95)',
            color: '#e2e8f0',
            border: '1px solid rgba(139,92,246,0.25)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            fontSize: '0.875rem',
            padding: '12px 16px',
            boxShadow: '0 0 30px rgba(124,58,237,0.15)',
          },
          success: { iconTheme: { primary: '#a855f7', secondary: '#030712' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#030712' } },
        }}
      />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/"          element={<PageWrapper><Home /></PageWrapper>} />
          <Route path="/result"    element={<PageWrapper><Result /></PageWrapper>} />
          <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
          <Route path="*"          element={<PageWrapper><NotFound /></PageWrapper>} />
        </Routes>
      </AnimatePresence>
    </>
  );
}
