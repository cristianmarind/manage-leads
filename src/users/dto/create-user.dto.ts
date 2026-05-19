import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Juan Pérez', minLength: 2 })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiProperty({ example: 'juan@onemillion.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Segura1234!', minLength: 8, description: 'Mínimo 8 caracteres' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
