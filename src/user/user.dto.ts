export class SilicUser {
  user_id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  userAddress?: string;
  created_at?: string;
}

export enum ModelType {
  WOMBO = 'WOMBO',
  REPLICATE = 'REPLICATE',
}
