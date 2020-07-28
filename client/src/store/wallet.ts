export function createWalletStore() {
  return {
    isFetchedBalance: false,
    balance: {},
    isFetchedReceipts: false,
    receipts: [],
    hasMoreReceipt: true,
    receiptLimit: 10,
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
    setIsFetchedReceipts(status: boolean) {
      this.isFetchedReceipts = status;
    },
    setReceipts(receipts: any) {
      if (receipts.length < this.receiptLimit) {
        this.hasMoreReceipt = false;
      }
      this.receipts = receipts;
    },
    addReceipts(receipts: any) {
      if (receipts.length < this.receiptLimit) {
        this.hasMoreReceipt = false;
      }
      this.receipts = this.receipts.concat(receipts);
    },
    setIsFetchedIsCustomPinExist(status: boolean) {
      this.isFetchedIsCustomPinExist = status;
    },
    setIsCustomPinExist(status: boolean) {
      this.isCustomPinExist = status;
    },
  };
}
