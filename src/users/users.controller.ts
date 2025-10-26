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
import { User } from './schema/users.schema';
import { CreateUserDto } from './dto/create-users.dto';
import { UpdateUserDto } from './dto/update-users.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id') 
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch('/deleted/:id')
  async softDelete(@Param('id') id: string): Promise<User> {
    return this.usersService.softDelete(id);
  }

  @Delete('/deleted/:id')
  async hardDelete(@Param('id') id: string): Promise<User> {
    return this.usersService.hardDelete(id);
  }

  @Patch('/restore/:id')
  async restore(@Param('id') id: string): Promise<User> {
    return this.usersService.restore(id);
  }
}
