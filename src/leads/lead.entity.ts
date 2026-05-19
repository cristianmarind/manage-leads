import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum Fuente {
  INSTAGRAM = 'instagram',
  FACEBOOK = 'facebook',
  LANDING_PAGE = 'landing_page',
  REFERIDO = 'referido',
  OTRO = 'otro',
}

@Entity('lead')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: false })
  nombre!: string;

  @Column({ unique: true, nullable: false })
  email!: string;

  @Column({ nullable: true, type: 'varchar' })
  telefono!: string | null;

  @Column({ type: 'enum', enum: Fuente, nullable: false })
  fuente!: Fuente;

  @Column({ nullable: true, type: 'varchar' })
  producto_interes!: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  presupuesto!: number | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
