import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { UserBasedDocument } from '../users/schema/userbase.schema';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<UserBasedDocument> {
    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) throw new ConflictException('Email already exists');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    return this.userService.create({
      ...registerDto,
      password: hashedPassword,
    });
  }

  async login(loginDto: LoginDto, res: Response) {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) throw new UnauthorizedException('Invalid');

    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isValidPassword) throw new UnauthorizedException('invalid');

    const accessToken = this.jwtService.sign({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 1 * 24 * 60 * 60 * 1000,
    });

    return { access_token: accessToken };
  }

  logout(res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    return {
      code: 'success',
      message: 'Logged out Successfully',
    };
  }

  async verifyToken(req: Request) {
    try {
      const token = req.cookies?.access_token;
      if (!token) {
        throw new UnauthorizedException('Invalid Credentials');
      }

      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      const existUser = await this.userService.findByEmail(decoded.email);

      if (!existUser || existUser._id.toString() !== decoded.userId) {
        throw new UnauthorizedException('Invalide credentials');
      }

      return {
        valid: true,
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }

  // verifyToken(token: string) {
  //   try {
  //     return this.jwtService.verify(token);
  //   } catch {
  //     throw new UnauthorizedException('Invalid token');
  //   }
  // }
}
