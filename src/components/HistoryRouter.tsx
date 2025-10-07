import React, { useLayoutEffect, useState } from 'react';
import { Router } from 'react-router-dom';
import { BrowserHistory } from 'history';

interface HistoryRouterProps {
  history: BrowserHistory;
  children: React.ReactNode;
}

const HistoryRouter: React.FC<HistoryRouterProps> = ({ history, children }) => {
  const [state, setState] = useState({
    action: history.action,
    location: history.location,
  });

  useLayoutEffect(() => history.listen(setState), [history]);

  return (
    <Router
      location={state.location}
      navigationType={state.action}
      navigator={history}
    >
      {children}
    </Router>
  );
};

export default HistoryRouter;