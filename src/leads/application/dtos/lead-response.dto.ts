import { ApiProperty } from '@nestjs/swagger';
import { Fuente } from '../../domain/fuente.enum';

export class LeadResponseDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  id!: string;

  @ApiProperty({ example: 'Juan Pérez' })
  nombre!: string;

  @ApiProperty({ example: 'juan@example.com' })
  email!: string;

  @ApiProperty({ example: '555-1234', nullable: true })
  telefono!: string | null;

  @ApiProperty({ enum: Fuente, example: Fuente.INSTAGRAM })
  fuente!: Fuente;

  @ApiProperty({ example: 'Plan Pro', nullable: true })
  producto_interes!: string | null;

  @ApiProperty({ example: 1500, nullable: true, description: 'Presupuesto en USD' })
  presupuesto!: number | null;

  @ApiProperty({ example: '2026-05-19T00:00:00.000Z' })
  created_at!: Date;

  @ApiProperty({ example: '2026-05-19T00:00:00.000Z' })
  updated_at!: Date;
}

export class PaginatedLeadsResponseDto {
  @ApiProperty({ type: [LeadResponseDto] })
  data!: LeadResponseDto[];

  @ApiProperty({ example: 100 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;
}

export class LeadStatsResponseDto {
  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({
    example: { instagram: 20, facebook: 10, landing_page: 7, referido: 3, otro: 2 },
  })
  por_fuente!: Record<string, number>;

  @ApiProperty({ example: 1250.5, nullable: true, description: 'Promedio en USD' })
  promedio_presupuesto!: number | null;

  @ApiProperty({ example: 8 })
  ultimos_7_dias!: number;
}

export class AiSummaryResponseDto {
  @ApiProperty({ example: 'El canal principal de captación es Instagram con un 47%...' })
  summary!: string;

  @ApiProperty({ example: 42 })
  leads_analyzed!: number;
}
