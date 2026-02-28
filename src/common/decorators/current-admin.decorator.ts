import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AdminJwtPayload } from '../types/admin-jwt-payload.type';

export const CurrentAdmin = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AdminJwtPayload | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.admin;
  },
);
