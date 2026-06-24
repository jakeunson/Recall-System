export interface UserProfile {
  id: string;
  displayName: string;
  trustLevel: number;       // 1-5, or 10 for admin
}
