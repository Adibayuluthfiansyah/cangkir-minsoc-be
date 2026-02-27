/**
 * JWT payload for authenticated admin users
 */
export interface AdminJwtPayload {
  /** Admin user ID (UUID) */
  id: string;

  /** Admin username */
  username: string;

  /** Issued at timestamp (automatically added by JWT) */
  iat?: number;

  /** Expiration timestamp (automatically added by JWT) */
  exp?: number;
}
