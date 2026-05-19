import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedLeads20260519000001 implements MigrationInterface {
  name = 'SeedLeads20260519000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO lead (id, nombre, email, telefono, fuente, producto_interes, presupuesto, created_at, updated_at)
      VALUES
        (uuid_generate_v4(), 'Carlos Mendoza',     'carlos.mendoza@gmail.com',    '+54 9 11 2345-6789', 'instagram',    'Curso de Marketing Digital',  1500.00, now(), now()),
        (uuid_generate_v4(), 'Valentina Ríos',     'valentina.rios@hotmail.com',  '+54 9 11 3456-7890', 'facebook',     'Mentoría 1:1',                 3000.00, now(), now()),
        (uuid_generate_v4(), 'Martín Gutiérrez',   'martin.gut@yahoo.com',        '+54 9 11 4567-8901', 'landing_page', 'Curso de Ventas Online',       1200.00, now(), now()),
        (uuid_generate_v4(), 'Sofía Herrera',      'sofia.herrera@gmail.com',     '+54 9 11 5678-9012', 'referido',     'Pack Emprendedor',             2500.00, now(), now()),
        (uuid_generate_v4(), 'Diego Fernández',    'diego.fernandez@outlook.com', '+54 9 11 6789-0123', 'instagram',    'Curso de Redes Sociales',       900.00, now(), now()),
        (uuid_generate_v4(), 'Lucía Ramírez',      'lucia.ramirez@gmail.com',     '+54 9 11 7890-1234', 'facebook',     'Mentoría Grupal',              1800.00, now(), now()),
        (uuid_generate_v4(), 'Tomás Castillo',     'tomas.castillo@gmail.com',    NULL,                 'otro',         'Curso de Finanzas Personales', 1100.00, now(), now()),
        (uuid_generate_v4(), 'Camila Torres',      'camila.torres@hotmail.com',   '+54 9 11 8901-2345', 'landing_page', 'Pack Emprendedor',             2500.00, now(), now()),
        (uuid_generate_v4(), 'Nicolás López',      'nicolas.lopez@gmail.com',     '+54 9 11 9012-3456', 'instagram',    'Curso de Marketing Digital',  1500.00, now(), now()),
        (uuid_generate_v4(), 'Florencia Vega',     'florencia.vega@gmail.com',    NULL,                 'referido',     'Mentoría 1:1',                 3000.00, now(), now()),
        (uuid_generate_v4(), 'Sebastián Morales',  'sebastian.morales@yahoo.com', '+54 9 11 0123-4567', 'facebook',     'Curso de Ventas Online',       1200.00, now(), now()),
        (uuid_generate_v4(), 'Ana Paula Rojas',    'anapaula.rojas@gmail.com',    '+54 9 11 1234-5670', 'landing_page', 'Curso de Redes Sociales',       900.00, now(), now()),
        (uuid_generate_v4(), 'Mateo Sánchez',      'mateo.sanchez@outlook.com',   '+54 9 11 2345-6780', 'instagram',    NULL,                            NULL,   now(), now()),
        (uuid_generate_v4(), 'Julieta Peralta',    'julieta.peralta@gmail.com',   '+54 9 11 3456-7891', 'referido',     'Pack Emprendedor',             2500.00, now(), now()),
        (uuid_generate_v4(), 'Agustín Navarro',    'agustin.navarro@gmail.com',   NULL,                 'otro',         'Mentoría Grupal',              1800.00, now(), now())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM lead
      WHERE email IN (
        'carlos.mendoza@gmail.com',
        'valentina.rios@hotmail.com',
        'martin.gut@yahoo.com',
        'sofia.herrera@gmail.com',
        'diego.fernandez@outlook.com',
        'lucia.ramirez@gmail.com',
        'tomas.castillo@gmail.com',
        'camila.torres@hotmail.com',
        'nicolas.lopez@gmail.com',
        'florencia.vega@gmail.com',
        'sebastian.morales@yahoo.com',
        'anapaula.rojas@gmail.com',
        'mateo.sanchez@outlook.com',
        'julieta.peralta@gmail.com',
        'agustin.navarro@gmail.com'
      )
    `);
  }
}
