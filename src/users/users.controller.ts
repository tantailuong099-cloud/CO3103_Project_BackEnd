import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserBased } from './schema/userbase.schema';
import { CreateUserDto } from './dto/create-users.dto';
import { UpdateUserDto } from './dto/update-users.dto';
import { Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(): Promise<UserBased[]> {
    return this.usersService.findAll();
  }

  @Get('count')
  async countAllUser() {
    return this.usersService.countAllUser();
  }

  @Get('user')
  async findUser() {
    return this.usersService.findUser();
  }

  @Get('admin')
  async findAdmin() {
    return this.usersService.findAdmin();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard) // nếu có auth guard
  getMe(@Req() req) {
    return this.usersService.findById(req.user.userId);
  }

  @Get(':id')
  getUserDetail(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  // @Patch('me')
  // @UseGuards(JwtAuthGuard)
  // async updateMe(@Req() req, @Body() updateUserDto: UpdateUserDto) {
  //   // req.user.userId comes from your JWT payload
  //   return this.usersService.update(req.user.userId, updateUserDto);
  // }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar')) // 1. Hứng file từ field 'avatar'
  async updateMe(
    @Req() req,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File, // 2. Lấy file object
  ) {
    // req.user.userId comes from your JWT payload
    // 3. Truyền cả userId, DTO và file sang service
    return this.usersService.update(req.user.userId, updateUserDto, file);
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserBased> {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserBased> {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch('/deleted/:id')
  async softDelete(@Param('id') id: string): Promise<UserBased> {
    return this.usersService.softDelete(id);
  }

  @Delete('/deleted/:id')
  async hardDelete(@Param('id') id: string): Promise<UserBased> {
    return this.usersService.hardDelete(id);
  }

  @Patch('/restore/:id')
  async restore(@Param('id') id: string): Promise<UserBased> {
    return this.usersService.restore(id);
  }
}
