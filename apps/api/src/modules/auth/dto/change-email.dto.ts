import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ChangeEmailDto {
  @IsEmail({}, { message: 'Please provide a valid new email address' })
  @IsNotEmpty({ message: 'New email is required' })
  newEmail!: string;

  @IsString()
  @IsNotEmpty({ message: 'Current password is required to verify identity' })
  password!: string;
}
