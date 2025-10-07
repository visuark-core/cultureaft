import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import HistoryRouter from './components/HistoryRouter.tsx';
import { history } from './services/navigationService.ts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HistoryRouter history={history}>
      <App />
    </HistoryRouter>
  </StrictMode>
);
