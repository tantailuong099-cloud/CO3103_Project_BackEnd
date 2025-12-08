import { UserRole } from '@/users/schema/userbase.schema';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  email: string;
  password: string;
  name: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
