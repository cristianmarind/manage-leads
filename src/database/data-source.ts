import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { LeadOrmEntity } from '../leads/infrastructure/persistence/lead.orm-entity';
import { User } from '../users/entities/user.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'onemillion',
  entities: [LeadOrmEntity, User],
  migrations: ['src/database/migrations/*.ts'],
});
