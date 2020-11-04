export default interface IUser {
  id: number;
  address: string;
  avatar: string;
  cover: string;
  bio?: string;
  privateSubscriptionEnabled: boolean;
  nickname: string;
}
