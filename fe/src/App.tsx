import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import Home from './pages/Home';
import Feed from './pages/Feed';
import Post from './pages/Post';
import TryFetch from './pages/TryFetch';

import { StoreProvider } from './store';

import './style/base.scss';

const AppRouter = () => {
  return (
    <StoreProvider>
      <Router>
        <div className="po-page-width po-center push-top-xxl">
          <Route path="/" exact component={Home} />
          <Route path="/:rssUrl" component={TryFetch} />
          <Route path="/:rssUrl" exact component={Feed} />
          <Route path="/:rssUrl/:guid" component={Post} />
        </div>
      </Router>
    </StoreProvider>
  );
};

export default AppRouter;
