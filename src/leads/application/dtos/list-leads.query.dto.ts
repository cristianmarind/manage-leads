import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Fuente } from '../../domain/fuente.enum';

export class ListLeadsQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({ enum: Fuente, example: Fuente.INSTAGRAM })
  @IsOptional()
  @IsEnum(Fuente, {
    message: `La fuente debe ser uno de: ${Object.values(Fuente).join(', ')}`,
  })
  fuente?: Fuente;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Fecha ISO 8601' })
  @IsOptional()
  @IsDateString({}, { message: 'date_from debe ser una fecha ISO válida' })
  date_from?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Fecha ISO 8601' })
  @IsOptional()
  @IsDateString({}, { message: 'date_to debe ser una fecha ISO válida' })
  date_to?: string;
}
