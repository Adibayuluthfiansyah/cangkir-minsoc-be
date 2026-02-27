import { AdminJwtPayload } from './admin-jwt-payload.type';

declare global {
  namespace Express {
    interface Request {
      admin?: AdminJwtPayload;
    }
  }
}

export {};
