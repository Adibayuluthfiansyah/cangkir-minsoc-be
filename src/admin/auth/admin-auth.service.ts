import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, LoginResponseDto } from '../dto/login.dto';
import { AdminJwtPayload } from '../../common/types/admin-jwt-payload.type';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // login admin
  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const admin = await this.prisma.admin.findUnique({
      where: { username: dto.username },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Admin account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      admin.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // update last login
    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: AdminJwtPayload = {
      id: admin.id,
      username: admin.username,
    };

    const accessToken = await this.jwt.signAsync(payload);
    const expiresIn = this.config.get<string>('jwt.expiresIn') || '7d';

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      admin: {
        id: admin.id,
        username: admin.username,
        fullName: admin.fullName,
      },
    };
  }

  // validate jwt token
  async validateToken(token: string): Promise<AdminJwtPayload> {
    try {
      const payload = await this.jwt.verifyAsync<AdminJwtPayload>(token);
      const admin = await this.prisma.admin.findUnique({
        where: { id: payload.id },
      });

      if (!admin || !admin.isActive) {
        throw new UnauthorizedException('Invalid token');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  // get admin profile
  async getProfile(adminId: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        username: true,
        fullName: true,
        phone: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    return admin;
  }
}
