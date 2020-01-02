import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import Header from './layouts/header';
import Feed from './pages/Feed';
import Post from './pages/Post';
import Author from './pages/Author';
import Subscription from './pages/Subscription';
import TryFetch from './pages/TryFetch';
import PermissionDeny from './pages/PermissionDeny';

import LoginModal from 'components/LoginModal';
import WalletModal from 'components/WalletModal';
import SnackBar from 'components/SnackBar';

import { isIPhone } from 'utils';

import { StoreProvider } from './store';

import './styles/tailwind.css';
import './styles/base.scss';

const AppRouter = () => {
  return (
    <StoreProvider>
      <Router>
        <div>
          <Route path="/" component={Header} />
          <div className={`container m-auto pt-5 md:pt-8`}>
            <Route path="/" component={TryFetch} />
            <Route path="/" exact component={Feed} />
            <Route path="/posts/:rId" exact component={Post} />
            <Route path="/authors/:address" exact component={Author} />
            <Route path="/subscriptions" exact component={Subscription} />
            <Route path="/permissionDeny" exact component={PermissionDeny} />
          </div>
          <LoginModal />
          <WalletModal />
          <SnackBar />
          <style jsx global>{`
            body {
              min-height: ${isIPhone ? '110vh' : '100vh'};
            }
          `}</style>
        </div>
      </Router>
    </StoreProvider>
  );
};

export default AppRouter;
