export function createUserStore() {
  return {
    isFetched: false,
    isLogin: false,
    shouldLogin: false,
    canPublish: false,
    user: {
      mixinAccount: {},
    } as Record<string, any>,
    profiles: [] as Array<any>,
    setUser(user: any) {
      this.user = user;
      this.isLogin = true;
    },
    setProfiles(profiles: any) {
      this.profiles = profiles;
    },
    addProfile(profile: any) {
      this.profiles.push(profile);
    },
    setIsFetched(status: boolean) {
      this.isFetched = status;
    },
    setShouldLogin() {
      this.shouldLogin = true;
    },
    setCanPublish() {
      this.canPublish = true;
    },
  };
}
