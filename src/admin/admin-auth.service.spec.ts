import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AdminAuthService } from './admin-auth.service';
import { PrismaService } from '../prisma/prisma.service';

// Mock bcrypt
jest.mock('bcrypt');

describe('AdminAuthService', () => {
  let service: AdminAuthService;

  const mockAdmin = {
    id: 'admin-uuid-123',
    username: 'admin',
    passwordHash: '$2b$10$hashedpassword',
    fullName: 'Admin User',
    phone: '081234567890',
    isActive: true,
    lastLoginAt: new Date('2026-02-28T10:00:00Z'),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-02-28T10:00:00Z'),
  };

  const mockPrismaService = {
    admin: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'jwt.expiresIn': '7d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AdminAuthService>(AdminAuthService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginDto = {
      username: 'admin',
      password: 'admin123',
    };

    it('should login successfully with valid credentials', async () => {
      const accessToken = 'jwt-token-12345';

      mockPrismaService.admin.findUnique.mockResolvedValue(mockAdmin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrismaService.admin.update.mockResolvedValue({
        ...mockAdmin,
        lastLoginAt: new Date(),
      });
      mockJwtService.signAsync.mockResolvedValue(accessToken);
      mockConfigService.get.mockReturnValue('7d');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        accessToken,
        tokenType: 'Bearer',
        expiresIn: '7d',
        admin: {
          id: mockAdmin.id,
          username: mockAdmin.username,
          fullName: mockAdmin.fullName,
        },
      });

      expect(mockPrismaService.admin.findUnique).toHaveBeenCalledWith({
        where: { username: loginDto.username },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockAdmin.passwordHash,
      );
      expect(mockPrismaService.admin.update).toHaveBeenCalledWith({
        where: { id: mockAdmin.id },
        data: { lastLoginAt: expect.any(Date) },
      });
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        id: mockAdmin.id,
        username: mockAdmin.username,
      });
    });

    it('should throw UnauthorizedException if admin not found', async () => {
      mockPrismaService.admin.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if admin is not active', async () => {
      const inactiveAdmin = { ...mockAdmin, isActive: false };
      mockPrismaService.admin.findUnique.mockResolvedValue(inactiveAdmin);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Admin account is deactivated',
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockPrismaService.admin.findUnique.mockResolvedValue(mockAdmin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockAdmin.passwordHash,
      );
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
      expect(mockPrismaService.admin.update).not.toHaveBeenCalled();
    });

    it('should update lastLoginAt on successful login', async () => {
      mockPrismaService.admin.findUnique.mockResolvedValue(mockAdmin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrismaService.admin.update.mockResolvedValue({
        ...mockAdmin,
        lastLoginAt: new Date(),
      });
      mockJwtService.signAsync.mockResolvedValue('token');

      await service.login(loginDto);

      expect(mockPrismaService.admin.update).toHaveBeenCalledWith({
        where: { id: mockAdmin.id },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it('should use default expiresIn if not configured', async () => {
      mockPrismaService.admin.findUnique.mockResolvedValue(mockAdmin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrismaService.admin.update.mockResolvedValue(mockAdmin);
      mockJwtService.signAsync.mockResolvedValue('token');
      mockConfigService.get.mockReturnValue(undefined as unknown as string);

      const result = await service.login(loginDto);

      expect(result.expiresIn).toBe('7d');
    });
  });

  describe('validateToken', () => {
    const token = 'valid-jwt-token';
    const payload = {
      id: mockAdmin.id,
      username: mockAdmin.username,
    };

    it('should validate token successfully', async () => {
      mockJwtService.verifyAsync.mockResolvedValue(payload);
      mockPrismaService.admin.findUnique.mockResolvedValue(mockAdmin);

      const result = await service.validateToken(token);

      expect(result).toEqual(payload);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(token);
      expect(mockPrismaService.admin.findUnique).toHaveBeenCalledWith({
        where: { id: payload.id },
      });
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(service.validateToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateToken('invalid-token')).rejects.toThrow(
        'Invalid token',
      );
    });

    it('should throw UnauthorizedException if admin not found', async () => {
      mockJwtService.verifyAsync.mockResolvedValue(payload);
      mockPrismaService.admin.findUnique.mockResolvedValue(null);

      await expect(service.validateToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateToken(token)).rejects.toThrow(
        'Invalid token',
      );
    });

    it('should throw UnauthorizedException if admin is not active', async () => {
      const inactiveAdmin = { ...mockAdmin, isActive: false };
      mockJwtService.verifyAsync.mockResolvedValue(payload);
      mockPrismaService.admin.findUnique.mockResolvedValue(inactiveAdmin);

      await expect(service.validateToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateToken(token)).rejects.toThrow(
        'Invalid token',
      );
    });

    it('should throw UnauthorizedException on JWT verification error', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Token expired'));

      await expect(service.validateToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getProfile', () => {
    const adminId = mockAdmin.id;

    it('should return admin profile', async () => {
      const profileData = {
        id: mockAdmin.id,
        username: mockAdmin.username,
        fullName: mockAdmin.fullName,
        phone: mockAdmin.phone,
        isActive: mockAdmin.isActive,
        lastLoginAt: mockAdmin.lastLoginAt,
        createdAt: mockAdmin.createdAt,
      };

      mockPrismaService.admin.findUnique.mockResolvedValue(profileData);

      const result = await service.getProfile(adminId);

      expect(result).toEqual(profileData);
      expect(mockPrismaService.admin.findUnique).toHaveBeenCalledWith({
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
    });

    it('should throw UnauthorizedException if admin not found', async () => {
      mockPrismaService.admin.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('non-existent-id')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.getProfile('non-existent-id')).rejects.toThrow(
        'Admin not found',
      );
    });
  });

  describe('bcrypt integration', () => {
    it('should use bcrypt.compare to verify password', async () => {
      const loginDto = {
        username: 'admin',
        password: 'plaintext-password',
      };

      mockPrismaService.admin.findUnique.mockResolvedValue(mockAdmin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrismaService.admin.update.mockResolvedValue(mockAdmin);
      mockJwtService.signAsync.mockResolvedValue('token');

      await service.login(loginDto);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'plaintext-password',
        '$2b$10$hashedpassword',
      );
    });
  });
});
