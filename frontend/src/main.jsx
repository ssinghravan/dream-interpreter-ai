import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(15,10,30,0.95)',
            color: '#f1f5f9',
            border: '1px solid rgba(139,92,246,0.3)',
            backdropFilter: 'blur(16px)',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#a855f7', secondary: '#0f0a1e' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#0f0a1e' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
