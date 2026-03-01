import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service';
import { LoginDto, LoginResponseDto } from '../dto/login.dto';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import type { AdminJwtPayload } from '../../common/types/admin-jwt-payload.type';

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AdminAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Admin login',
    description: 'Login with username and password to get JWT access token',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or account deactivated',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      },
    },
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get admin profile',
    description: 'Get current logged-in admin profile information',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile retrieved successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'admin',
        fullName: 'Admin User',
        phone: '628123456789',
        isActive: true,
        lastLoginAt: '2026-03-01T10:30:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing JWT token',
  })
  getProfile(@CurrentAdmin() admin: AdminJwtPayload) {
    return this.authService.getProfile(admin.id);
  }
}
