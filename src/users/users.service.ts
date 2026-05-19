import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  private toSafeUser(user: User): UserResponseDto {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async createUser(dto: CreateUserDto): Promise<UserResponseDto> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const existing = await this.usersRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException(`User with email "${normalizedEmail}" already exists`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepository.create({
      fullName: dto.fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      isActive: dto.isActive ?? true,
    });

    const saved = await this.usersRepository.save(user);
    return this.toSafeUser(saved);
  }

  async getUsersPaginated(query: PaginationQueryDto): Promise<{
    items: UserResponseDto[];
    page: number;
    limit: number;
    total: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.usersRepository
      .createQueryBuilder('user')
      .where('user.deletedAt IS NULL');

    if (query.search) {
      const term = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(user.fullName) LIKE :term OR LOWER(user.email) LIKE :term)',
        { term },
      );
    }

    if (query.isActive !== undefined) {
      qb.andWhere('user.isActive = :isActive', { isActive: query.isActive });
    }

    const total = await qb.getCount();
    const users = await qb
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { items: users.map((u) => this.toSafeUser(u)), page, limit, total };
  }

  async getUserById(userId: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User "${userId}" not found`);
    }

    return this.toSafeUser(user);
  }

  async updateUser(userId: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User "${userId}" not found`);
    }

    if (dto.fullName !== undefined) user.fullName = dto.fullName.trim();
    if (dto.isActive !== undefined) user.isActive = dto.isActive;

    const updated = await this.usersRepository.save(user);
    return this.toSafeUser(updated);
  }

  async setUserActive(userId: string, isActive: boolean): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User "${userId}" not found`);
    }

    user.isActive = isActive;
    const updated = await this.usersRepository.save(user);
    return this.toSafeUser(updated);
  }

  async deleteUser(userId: string, actorUserId?: string): Promise<{ ok: boolean }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User "${userId}" not found`);
    }

    if (actorUserId && actorUserId === userId) {
      throw new ConflictException('Cannot delete your own account');
    }

    await this.usersRepository.softRemove(user);
    return { ok: true };
  }
}
