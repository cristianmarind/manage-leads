import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  id: string;

  @ApiProperty({ example: 'Juan Pérez' })
  fullName: string;

  @ApiProperty({ example: 'juan@onemillion.com' })
  email: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-05-19T12:00:00.000Z', nullable: true })
  lastLoginAt: Date | null;

  @ApiProperty({ example: '2026-05-19T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-05-19T00:00:00.000Z' })
  updatedAt: Date;
}

export class UsersPaginatedResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  items: UserResponseDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 42 })
  total: number;
}
