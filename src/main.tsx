// Suppress non-critical Firestore SDK internal bloom filter notices
if (typeof window !== 'undefined') {
  const suppressBloomFilter = (fn: (...args: any[]) => void) => {
    return (...args: any[]) => {
      const combined = args.map(a => (typeof a === 'object' && a !== null ? (a.message || a.stack || JSON.stringify(a)) : String(a))).join(' ');
      if (combined.includes('BloomFilter') || combined.includes('Invalid hash count')) {
        return;
      }
      fn(...args);
    };
  };
  console.warn = suppressBloomFilter(console.warn);
  console.error = suppressBloomFilter(console.error);
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
