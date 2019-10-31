export interface IComment {
  content: string;

  objectType: string;

  id?: number;

  objectId?: number | null;

  userId?: string;

  user?: any;

  created_at?: string;

  updated_at?: string;
}
