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
    },
    closeLogin() {
      this.login.open = false;
      this.login.data = {};
    },
    openWallet(data: any = {}) {
      this.wallet.open = true;
      this.wallet.data = data;
    },
    closeWallet() {
      this.wallet.open = false;
      this.wallet.data = {};
    },
  };
}
