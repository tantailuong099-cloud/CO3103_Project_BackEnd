import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserBased } from './schema/userbase.schema';
import { CreateUserDto } from './dto/create-users.dto';
import { UpdateUserDto } from './dto/update-users.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(): Promise<UserBased[]> {
    return this.usersService.findAll();
  }

  @Get('user')
  async findUser() {
    return this.usersService.findUser();
  }

  @Get('admin')
  async findAdmin() {
    return this.usersService.findAdmin();
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
