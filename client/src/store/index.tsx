import React from 'react';
import { toJS } from 'mobx';
import { useLocalStore } from 'mobx-react-lite';
import { createPreloadStore } from './preload';
import { createUserStore } from './user';
import { createFeedStore } from './feed';
import { createCacheStore } from './cache';
import { createWalletStore } from './wallet';
import { createSnackbarStore } from './snackbar';
import { createSocketStore } from './socket';
import { createCommentStore } from './comment';
import { createModalStore } from './modal';
import { createPathStore } from './lastPath';
import { createSettingsStore } from './settings';
import { createNotificationStore } from './notification';
import { createConfirmDialogStore } from './confirmDialog';
import { createFilesStore } from './files';
import { createPublishDialogStore } from './publishDialog';
import { createAuthorStore } from './author';

const storeContext = React.createContext<any>(null);

interface IProps {
  children: React.ReactNode;
}

const useCreateStore = () => ({
  preloadStore: useLocalStore(createPreloadStore),
  userStore: useLocalStore(createUserStore),
  feedStore: useLocalStore(createFeedStore),
  cacheStore: useLocalStore(createCacheStore),
  walletStore: useLocalStore(createWalletStore),
  snackbarStore: useLocalStore(createSnackbarStore),
  socketStore: useLocalStore(createSocketStore),
  commentStore: useLocalStore(createCommentStore),
  modalStore: useLocalStore(createModalStore),
  pathStore: useLocalStore(createPathStore),
  settingsStore: useLocalStore(createSettingsStore),
  notificationStore: useLocalStore(createNotificationStore),
  confirmDialogStore: useLocalStore(createConfirmDialogStore),
  fileStore: useLocalStore(createFilesStore),
  publishDialogStore: useLocalStore(createPublishDialogStore),
  authorStore: useLocalStore(createAuthorStore),
});

export const StoreProvider = ({ children }: IProps) => {
  const store = useCreateStore();
  return <storeContext.Provider value={store}>{children}</storeContext.Provider>;
};

export const useStore = () => {
  const store = React.useContext(storeContext);
  if (!store) {
    throw new Error('You have forgot to use StoreProvider');
  }
  (window as any).toJS = toJS;
  (window as any).store = store;
  return store as ReturnType<typeof useCreateStore>;
};
