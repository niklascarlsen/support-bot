import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import '@fontsource/arimo/400.css';
import '@fontsource/arimo/500.css';
import '@fontsource/arimo/600.css';
import '@fontsource/arimo/700.css';
import 'streamdown/styles.css';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
