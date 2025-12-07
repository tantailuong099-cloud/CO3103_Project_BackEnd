import { UserRole } from '@/users/schema/userbase.schema';

export class RegisterDto {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}
