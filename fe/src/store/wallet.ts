export function createWalletStore() {
  return {
    isFetchedBalance: false,
    balance: {},
    receipts: [],
    isFetchedIsCustomPinExist: false,
    isCustomPinExist: false,
    get hasBalance() {
      return Object.values(this.balance).some((amount: any) => amount > 0);
    },
    setIsFetchedBalance(status: boolean) {
      this.isFetchedBalance = status;
    },
    setBalance(balance: any) {
      this.balance = balance;
    },
    setReceipts(receipts: any) {
      this.receipts = receipts;
    },
    setIsFetchedIsCustomPinExist(status: boolean) {
      this.isFetchedIsCustomPinExist = status;
    },
    setIsCustomPinExist(status: boolean) {
      this.isCustomPinExist = status;
    },
  };
}
