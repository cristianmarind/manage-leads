export class AuthUserDto {
  id: string;
  email: string;
  fullName: string;
}

export class LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDto;
}

export class RefreshResponseDto {
  accessToken: string;
  refreshToken: string;
}

export class LogoutResponseDto {
  ok: boolean;
}
