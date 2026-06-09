import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { LanguageProvider } from './context/LanguageContext';
import './styles/global.css';

// Import page styles
import './styles/pages/_home.scss';
import './styles/pages/_blog.scss';
import './styles/pages/_notes.scss';
import './styles/pages/_profile.scss';
import './styles/pages/_dev-tools.scss';
import './styles/pages/_notifications.scss';
import './styles/pages/_settings.scss';
import './styles/components/_header.scss';
import './styles/components/_footer.scss';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
);