export class CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: 'User' | 'Admin';
  avatar?: string;
  phoneNumber?: string;
}
