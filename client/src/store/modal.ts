import { stopBodyScroll } from 'utils';
import { IPost } from 'apis/post';
import { IFile } from 'apis/file';

interface IUserListData {
  topicUuid?: string;
  title: string;
  type: 'FOLLOWING_USERS' | 'USER_FOLLOWERS' | 'TOPIC_FOLLOWERS' | 'TOPIC_AUTHORS';
  authorAddress: string;
  onClose?: () => void;
}

type ITopicListData = {
  post?: IPost;
  title: string;
  type: 'CREATED_TOPICS' | 'FOLLOWING_TOPICS' | 'CONTRIBUTION_TO_MY_TOPICS' | 'CONTRIBUTED_TOPICS' | 'CONTRIBUTION_TO_PUBLIC_TOPICS',
  userAddress?: string;
  onClose?: () => void;
}

type IContributionData = {
  file: IFile;
  onClose?: () => void;
}

type INotificationData = {
  tab?: number;
  messageId?: number;
}

export function createModalStore() {
  return {
    authProviders: [] as string[],
    showPageLoading: false,
    phoneLogin: false,
    settings: {
      open: false,
      tab: 'profile',
    },
    login: {
      open: false,
      data: {},
    },
    wallet: {
      open: false,
      data: {} as Record<string, any>,
    },
    notification: {
      open: false,
      data: {} as INotificationData,
    },
    mixinNotification: {
      open: false,
      data: {},
    },
    userList: {
      open: false,
      data: {
        title: '',
        type: 'FOLLOWING_USERS',
        authorAddress: ''
      } as IUserListData,
    },
    topicList: {
      open: false,
      data: {
        title: '',
        type: 'CREATED_TOPICS',
      } as ITopicListData,
    },
    topicEditor: {
      open: false,
      data: {},
    },
    contribution: {
      open: false,
      data: {} as IContributionData
    },
    favorites: {
      open: false,
      data: {},
    },
    setAuthProviders(authProviders: string[]) {
      this.authProviders = authProviders;
    },
    openLogin(data: any = {}) {
      if (this.authProviders.includes('phone')) {
        this.openPhoneLogin();
        return;
      }
      this.login.open = true;
      this.login.data = data;
      stopBodyScroll(true);
    },
    closeLogin() {
      this.login.open = false;
      this.login.data = {};
      stopBodyScroll(false);
    },
    openPageLoading() {
      this.showPageLoading = true;
    },
    closePageLoading() {
      this.showPageLoading = false;
    },
    openWallet(data: any = {}) {
      this.wallet.data = data;
      this.wallet.open = true;
      stopBodyScroll(true);
    },
    closeWallet() {
      this.wallet.open = false;
      this.wallet.data = {};
      stopBodyScroll(false);
    },
    openNotification(data: INotificationData = {}) {
      this.notification.data = data;
      this.notification.open = true;
      stopBodyScroll(true);
    },
    closeNotification() {
      this.notification.open = false;
      this.notification.data = {};
      stopBodyScroll(false);
    },
    openMixinNotification(data: any = {}) {
      this.mixinNotification.data = data;
      this.mixinNotification.open = true;
      stopBodyScroll(true);
    },
    closeMixinNotification() {
      this.mixinNotification.open = false;
      this.mixinNotification.data = {};
      stopBodyScroll(false);
    },
    openPhoneLogin() {
      this.phoneLogin = true;
      stopBodyScroll(true);
    },
    closePhoneLogin() {
      this.phoneLogin = false;
      stopBodyScroll(false);
    },
    openSettings(tab?: string) {
      this.settings.open = true;
      if (tab) {
        this.settings.tab = tab;
      }
    },
    closeSettings() {
      this.settings.open = false;
    },
    openUserList(data: IUserListData) {
      this.userList.data = data;
      this.userList.open = true;
      stopBodyScroll(true);
    },
    closeUserList() {
      this.userList.open = false;
      if (this.userList.data.onClose) {
        this.userList.data.onClose();
      }
      stopBodyScroll(false);
    },
    openTopicList(data: ITopicListData) {
      this.topicList.data = data;
      this.topicList.open = true;
      stopBodyScroll(true);
    },
    closeTopicList() {
      this.topicList.open = false;
      if (this.topicList.data.onClose) {
        this.topicList.data.onClose();
      }
      stopBodyScroll(false);
    },
    openContribution(data: IContributionData) {
      this.contribution.data = data;
      this.contribution.open = true;
      stopBodyScroll(true);
    },
    closeContribution() {
      this.contribution.open = false;
      if (this.contribution.data.onClose) {
        this.contribution.data.onClose();
      }
      stopBodyScroll(false);
    },
    openFavorites() {
      this.favorites.open = true;
      stopBodyScroll(true);
    },
    closeFavorites() {
      this.favorites.open = false;
      stopBodyScroll(false);
    },
  };
}
