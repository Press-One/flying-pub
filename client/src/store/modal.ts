import { stopBodyScroll, isWeChat, getLoginUrl, isMobile } from 'utils';
import Api from 'api';

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
      data: {},
    },
    mixinNotification: {
      open: false,
      data: {},
    },
    setAuthProviders(authProviders: string[]) {
      this.authProviders = authProviders;
    },
    openLogin(data: any = {}) {
      // 如果支持手机号，那么优先使用手机登录
      if (this.authProviders.includes('phone')) {
        this.openPhoneLogin();
        return;
      }
      if (isMobile) {
        this.showPageLoading = true;
      }
      if (isMobile && !isWeChat) {
        window.location.href = getLoginUrl();
        return;
      }
      this.login.open = true;
      this.login.data = data;
      stopBodyScroll(true);
      if (isWeChat) {
        Api.setAutoLoginUrl(getLoginUrl());
      }
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
      this.wallet.open = true;
      this.wallet.data = data;
      stopBodyScroll(true);
    },
    closeWallet() {
      this.wallet.open = false;
      this.wallet.data = {};
      stopBodyScroll(false);
    },
    openNotification(data: any = {}) {
      this.notification.open = true;
      this.notification.data = data;
      stopBodyScroll(true);
    },
    closeNotification() {
      this.notification.open = false;
      this.notification.data = {};
      stopBodyScroll(false);
    },
    openMixinNotification(data: any = {}) {
      this.mixinNotification.open = true;
      this.mixinNotification.data = data;
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
  };
}
