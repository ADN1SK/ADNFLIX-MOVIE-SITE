import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize UI preferences
const savedColor = localStorage.getItem("adnflix_accent_color");
if (savedColor) {
  document.documentElement.style.setProperty("--color-primary", savedColor);
}
const savedScale = localStorage.getItem("adnflix_ui_scale");
if (savedScale) {
  document.documentElement.style.fontSize = `${savedScale}%`;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
