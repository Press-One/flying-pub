export function createWalletStore() {
  return {
    isFetched: false,
    balance: {},
    setIsFetched(status: boolean) {
      this.isFetched = status;
    },
    setBalance(balance: any) {
      this.balance = balance;
    },
  };
}
