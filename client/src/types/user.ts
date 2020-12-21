export default interface IUser {
  id: number;
  address: string;
  avatar: string;
  cover: string;
  bio?: string;
  privateSubscriptionEnabled: boolean;
  privateContributionEnabled: boolean;
  nickname: string;
}
