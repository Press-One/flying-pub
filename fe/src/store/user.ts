export function createUserStore() {
  return {
    isFetched: false,
    isLogin: false,
    id: 0,
    avatar: '',
    name: '',
    bio: '',
    setUser(user: any) {
      this.isLogin = true;
      this.id = user.id;
      this.avatar = user.avatar;
      this.name = user.name;
      this.bio = user.bio;
    },
    setIsFetched() {
      this.isFetched = true;
    },
  };
}
