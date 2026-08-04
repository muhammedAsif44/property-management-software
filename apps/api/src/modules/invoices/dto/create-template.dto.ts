import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';

export class CreateTemplateDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  htmlContent!: string;

  @IsOptional()
  @IsObject()
  themeConfig?: Record<string, any>;
}
