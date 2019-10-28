export function createUserStore() {
  return {
    isFetched: false,
    user: 0,
    mixinAccount: {},
    setUser(user: any) {
      this.user = user;
      this.mixinAccount = JSON.parse(user.raw);
    },
    setIsFetched(status: boolean) {
      this.isFetched = status;
    },
  };
}
