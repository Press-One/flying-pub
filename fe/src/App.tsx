import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import Home from './pages/Home';
import Feed from './pages/Feed';
import Post from './pages/Post';

import { StoreProvider } from './store';

import './style/base.scss';

const AppRouter = () => {
  return (
    <StoreProvider>
      <Router>
        <div>
          <Route path="/" exact component={Home} />
          <Route path="/:rssUrl" exact component={Feed} />
          <Route path="/:rssUrl/:id" component={Post} />
        </div>
      </Router>
    </StoreProvider>
  );
};

export default AppRouter;
