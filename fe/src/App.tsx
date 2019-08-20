import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import Home from './pages/Home';

import { StoreProvider } from './store';

import './style/base.scss';

const AppRouter = () => {
  return (
    <StoreProvider>
      <Router>
        <div>
          <Route path="/" exact component={Home} />
        </div>
      </Router>
    </StoreProvider>
  );
};

export default AppRouter;
