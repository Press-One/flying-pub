export function createWalletStore() {
  return {
    isFetched: false,
    balance: {},
    receipts: [],
    setIsFetched(status: boolean) {
      this.isFetched = status;
    },
    setBalance(balance: any) {
      this.balance = balance;
    },
    setReceipts(receipts: any) {
      this.receipts = receipts;
    },
  };
}
