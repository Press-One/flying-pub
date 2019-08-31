import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import Feed from './pages/Feed';
import Post from './pages/Post';
import TryFetch from './pages/TryFetch';
import { isMobile } from './utils';

import { StoreProvider } from './store';

import './style/base.scss';

const AppRouter = () => {
  return (
    <StoreProvider>
      <Router>
        <div className={`po-page-width po-center push-top-${isMobile ? 'md' : 'xl'}`}>
          <Route path="/" component={TryFetch} />
          <Route path="/" exact component={Feed} />
          <Route path="/:postId" component={Post} />
        </div>
      </Router>
    </StoreProvider>
  );
};

export default AppRouter;
