export interface JwtPayload {
  sub: string;
  email: string;
  tokenVersion: number;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}
