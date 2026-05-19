import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@onemillion.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin1234!', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
