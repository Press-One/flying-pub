import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import Header from './layouts/header';
import Feed from './pages/Feed';
import Post from './pages/Post';
import Wallet from './components/WalletModal/Wallet';
import TryFetch from './pages/TryFetch';
import PermissionDeny from './pages/PermissionDeny';

import LoginModal from 'components/LoginModal';
import WalletModal from 'components/WalletModal';
import SnackBar from 'components/SnackBar';

import { isMobile } from './utils';

import { StoreProvider } from './store';

import './styles/tailwind.css';
import './styles/base.scss';

const AppRouter = () => {
  if (isMobile && process.env.NODE_ENV === 'production') {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="text-red-400">飞贴 v2 手机端正在适配，请移步到电脑端体验</div>
      </div>
    );
  }

  return (
    <StoreProvider>
      <Router>
        <div>
          <Header />
          <div className={`container m-auto pt-5 md:pt-8`}>
            <Route path="/" component={TryFetch} />
            <Route path="/" exact component={Feed} />
            <Route path="/posts/:postId" exact component={Post} />
            <Route path="/wallet" exact component={Wallet} />
            <Route path="/permissionDeny" exact component={PermissionDeny} />
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
