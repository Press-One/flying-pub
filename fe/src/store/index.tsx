import React from 'react';
import { toJS } from 'mobx';
import { useLocalStore } from 'mobx-react-lite';
import { createUserStore } from './user';
import { createFeedStore } from './feed';
import { createCacheStore } from './cache';
import { createWalletStore } from './wallet';
import { createSnackbarStore } from './snackbar';
import { createSocketStore } from './socket';
import { createCommentStore } from './comment';

const storeContext = React.createContext<any>(null);

interface IProps {
  children: React.ReactNode;
}

export const StoreProvider = ({ children }: IProps) => {
  const store = {
    userStore: useLocalStore(createUserStore),
    feedStore: useLocalStore(createFeedStore),
    cacheStore: useLocalStore(createCacheStore),
    walletStore: useLocalStore(createWalletStore),
    snackbarStore: useLocalStore(createSnackbarStore),
    socketStore: useLocalStore(createSocketStore),
    commentStore: useLocalStore(createCommentStore),
  };
  return <storeContext.Provider value={store}>{children}</storeContext.Provider>;
};

export const useStore = () => {
  const store = React.useContext(storeContext);
  if (!store) {
    throw new Error('You have forgot to use StoreProvider');
  }
  (window as any).toJS = toJS;
  (window as any).store = store;
  return store;
};
