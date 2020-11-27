import Api from 'api';

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
    newFeatRecord: [] as Array<string>,
    setUser(user: any) {
      this.user = user;
      this.isLogin = true;
      this.newFeatRecord = JSON.parse(user.newFeatRecord);
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
    async addNewFeatRecord(feat: string) {
      try {
        this.newFeatRecord.push(feat);
        await Api.addNewFeatRecord(feat);
      } catch {}
    },
  };
}
