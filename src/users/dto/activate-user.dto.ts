import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ActivateUserDto {
  @ApiProperty({ example: true, description: 'true activa el usuario, false lo desactiva' })
  @IsBoolean()
  isActive: boolean;
}
