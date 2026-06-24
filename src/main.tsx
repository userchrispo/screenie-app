import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ToastProvider } from './components/ToastProvider';
import { initTheme } from './lib/theme';
import { initPreferences } from './lib/preferences';
import './styles/global.css';

initTheme();
initPreferences();

const root = document.getElementById('root');

if (!root) {
  throw new Error('Screenie root element was not found.');
}

createRoot(root).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>
);
