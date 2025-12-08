import { CreateUserDto } from './create-users.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateUserDto {
  name?: string;
  avatar?: string;
  phoneNumber?: string;
  address?: string;

}