import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  private readonly refreshTokenSecret: string;
  private readonly refreshTokenTtlDays: number;

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.refreshTokenSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.get<string>('JWT_SECRET', 'refresh-secret-key');
    this.refreshTokenTtlDays = this.configService.get<number>('JWT_REFRESH_TTL_DAYS', 7);
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email.toLowerCase().trim(), isActive: true },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    user.lastLoginAt = new Date();
    await this.usersRepository.save(user);

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateAndStoreRefreshToken(user);

    if (!accessToken || !refreshToken) {
      throw new InternalServerErrorException('Failed to generate tokens');
    }

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, fullName: user.fullName },
    };
  }

  async refresh(dto: RefreshDto) {
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.refreshTokenSecret,
      }) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.usersRepository.findOne({
      where: { id: payload.sub, isActive: true },
    });

    if (!user) throw new UnauthorizedException('User not found or inactive');
    if (payload.tokenVersion !== user.tokenVersion) throw new UnauthorizedException('Token version mismatch');
    if (!user.refreshTokenHash) throw new UnauthorizedException('No refresh token found');

    const isValid = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);
    if (!isValid) throw new UnauthorizedException('Invalid refresh token');

    if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: await this.generateAndStoreRefreshToken(user),
    };
  }

  async logout(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (user) {
      user.refreshTokenHash = null;
      user.refreshTokenExpiresAt = null;
      await this.usersRepository.save(user);
    }
    return { ok: true };
  }

  async logoutAll(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (user) {
      user.tokenVersion += 1;
      user.refreshTokenHash = null;
      user.refreshTokenExpiresAt = null;
      await this.usersRepository.save(user);
    }
    return { ok: true };
  }

  async getMe(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) throw new UnauthorizedException('User not found');

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  private generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
      type: 'access',
    };
    return this.jwtService.sign(payload);
  }

  private async generateAndStoreRefreshToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
      type: 'refresh',
    };

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.refreshTokenSecret,
      expiresIn: `${this.refreshTokenTtlDays}d`,
    });

    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    user.refreshTokenExpiresAt = new Date(
      Date.now() + this.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
    );
    await this.usersRepository.save(user);

    return refreshToken;
  }
}
