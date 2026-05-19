import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Fuente } from '../../domain/fuente.enum';

@Entity('lead')
export class LeadOrmEntity {
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

  @DeleteDateColumn()
  deleted_at!: Date | null;
}
