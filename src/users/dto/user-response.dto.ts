export class UserResponseDto {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UsersPaginatedResponseDto {
  items: UserResponseDto[];
  page: number;
  limit: number;
  total: number;
}
