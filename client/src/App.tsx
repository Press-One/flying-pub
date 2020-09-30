import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import Header from './layouts/header';
import Feed from './pages/Feed';
import Post from './pages/Post';
import Author from './pages/Author';
import Subscription from './pages/Subscription';
import TryFetch from './pages/TryFetch';
import ManagementLayout from './pages/ManagementLayout';
import Editor from './pages/Editor';

import LoginModal from 'components/LoginModal';
import PhoneLoginModal from 'components/PhoneLoginModal';
import WalletModal from 'components/WalletModal';
import ReaderWalletModal from 'components/ReaderWalletModal';
import NotificationSocket from 'components/NotificationSocket';
import SnackBar from 'components/SnackBar';
import SettingsModal from 'components/SettingsModal';
import PageLoading from './components/PageLoading';
import Contact from './components/Contact';
import MixinNotificationModal from 'components/MixinNotificationModal';
import PublishDialog from './components/PublishDialog';
import ConfirmDialog from './components/ConfirmDialog';
import GlobalQueryHandler from './components/GlobalQueryHandler';

import { isIPhone, isPc } from 'utils';

import { StoreProvider } from './store';

import './styles/tailwind.css';
import './styles/base.scss';
import 'font-awesome/css/font-awesome.css';

const Reader = () => {
  return (
    <div>
      <Route path="/" component={Header} />
      <div className={`container m-auto pt-5 md:pt-8`}>
        <Route path="/" exact component={Feed} />
        <Route path="/posts/:rId" exact component={Post} />
        <Route path="/authors/:address" exact component={Author} />
        <Route path="/subscriptions" exact component={Subscription} />
      </div>
    </div>
  );
};

const Pub = () => {
  return (
    <div>
      <Route path="/editor" exact component={Editor} />
      <Route
        path={['/dashboard', '/topic', '/postManager', '/sticky']}
        exact
        component={ManagementLayout}
      />
    </div>
  );
};

const AppRouter = () => {
  return (
    <StoreProvider>
      <Router>
        <div>
          <Route path="/" component={TryFetch} />
          <Route
            path={['/', '/posts/:rId', '/authors/:address', '/subscriptions']}
            exact
            component={Reader}
          />
          {isPc && (
            <div>
              <Pub />
              <PublishDialog />
            </div>
          )}
          <Route path="/readerWallet" exact component={ReaderWalletModal} />

          <LoginModal />
          <PhoneLoginModal />
          <WalletModal />
          <SnackBar />
          <NotificationSocket />
          <PageLoading />
          <SettingsModal />
          <MixinNotificationModal />
          <ConfirmDialog />
          <GlobalQueryHandler />
          {isPc && <Contact />}
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
