import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import Header from './layouts/header';
import Feed from './pages/Feed';
import Post from './pages/Post';
import Wallet from './components/WalletModal/Wallet';
import TryFetch from './pages/TryFetch';

import LoginModal from 'components/LoginModal';
import WalletModal from 'components/WalletModal';
import SnackBar from 'components/SnackBar';

import { isMobile } from './utils';

import { StoreProvider } from './store';

import './styles/tailwind.css';
import './styles/base.scss';

const AppRouter = () => {
  return (
    <StoreProvider>
      <Router>
        <div>
          <Header />
          <div className={`container m-auto push-top-${isMobile ? 'md' : 'xl'}`}>
            <Route path="/" component={TryFetch} />
            <Route path="/" exact component={Feed} />
            <Route path="/posts/:postId" exact component={Post} />
            <Route path="/wallet" exact component={Wallet} />
          </div>
          <LoginModal />
          <WalletModal />
          <SnackBar />
        </div>
      </Router>
    </StoreProvider>
  );
};

export default AppRouter;
