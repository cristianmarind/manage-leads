import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateLeadsTable20260519000000 implements MigrationInterface {
  name = 'CreateLeadsTable20260519000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."lead_fuente_enum" AS ENUM(
        'instagram',
        'facebook',
        'landing_page',
        'referido',
        'otro'
      )
    `);

    await queryRunner.createTable(
      new Table({
        name: 'lead',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'nombre',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'telefono',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'fuente',
            type: 'enum',
            enum: ['instagram', 'facebook', 'landing_page', 'referido', 'otro'],
            enumName: 'lead_fuente_enum',
            isNullable: false,
          },
          {
            name: 'producto_interes',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'presupuesto',
            type: 'numeric',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('lead');
    await queryRunner.query(`DROP TYPE "public"."lead_fuente_enum"`);
  }
}
