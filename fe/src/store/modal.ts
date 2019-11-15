import { stopBodyScroll, isWeChat, getLoginUrl } from 'utils';
import Api from 'api';

export function createModalStore() {
  return {
    login: {
      open: false,
      data: {},
    },
    wallet: {
      open: false,
      data: {},
    },
    openLogin(data: any = {}) {
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
  };
}
