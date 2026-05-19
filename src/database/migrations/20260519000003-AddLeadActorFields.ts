import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLeadActorFields20260519000003 implements MigrationInterface {
  name = 'AddLeadActorFields20260519000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('lead', [
      new TableColumn({
        name: 'creator_id',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'updater_id',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'deleter_id',
        type: 'uuid',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('lead', ['creator_id', 'updater_id', 'deleter_id']);
  }
}
