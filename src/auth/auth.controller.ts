import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import * as jwt from 'jsonwebtoken';
import { UsersService } from '../users/users.service';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token } = await this.authService.login(loginDto);

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: false, // ⚠️ false khi test localhost, true khi deploy HTTPS
      sameSite: 'lax', // ⚠️ bắt buộc khi khác port
      maxAge: 1 * 24 * 60 * 60 * 1000,
    });

    return { access_token };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/', // Đảm bảo xóa toàn site
    });

    return { message: 'Logged out successfully' };
  }

  @Get('verify')
  async verify(@Req() req: Request) {
    try {
      const token = req.cookies?.access_token;
      if (!token) throw new UnauthorizedException('Missing token');

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'supersecretkey',
      ) as { userId: string; email: string };

      const user = await this.userService.findByEmail(decoded.email);
      if (!user || user._id.toString() !== decoded.userId) {
        throw new UnauthorizedException('Invalid user');
      }

      return { valid: true, userId: user._id, email: user.email };
    } catch (err) {
      console.error('verify token error:', err.message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
    return req.user; // { userId, email }
  }
}
