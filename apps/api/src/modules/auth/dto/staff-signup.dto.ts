import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class StaffSignupDto {
  @IsString({ message: 'Full name is required' })
  name!: string;

  @IsEmail({}, { message: 'Please enter a valid email address' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
