export interface AdminJwtPayload {
  id: string;
  username: string;
  iat?: number;
  exp?: number;
}
