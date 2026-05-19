import { MigrationInterface, QueryRunner } from 'typeorm';

// Password: Admin1234!
const PASSWORD_HASH = '$2b$10$CRsFyXDMMbhfgG4OYLNLN.lFsbGTf6e.czQDsgdUaq8tEMjd.PXca';

export class SeedTestUser20260519000004 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO users (id, full_name, email, password_hash, is_active, token_version, created_at, updated_at)
      VALUES (
        uuid_generate_v4(),
        'Admin Test',
        'admin@onemillion.com',
        '${PASSWORD_HASH}',
        true,
        0,
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO NOTHING;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM users WHERE email = 'admin@onemillion.com';`);
  }
}
