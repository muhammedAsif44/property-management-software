import { IsString, MinLength } from 'class-validator';

export class RequestDeletionDto {
  @IsString()
  @MinLength(5)
  reason!: string;
}
