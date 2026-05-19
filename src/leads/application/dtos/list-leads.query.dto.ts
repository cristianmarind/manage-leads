import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Fuente } from '../../domain/fuente.enum';

export class ListLeadsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsEnum(Fuente, {
    message: `La fuente debe ser uno de: ${Object.values(Fuente).join(', ')}`,
  })
  fuente?: Fuente;

  @IsOptional()
  @IsDateString({}, { message: 'date_from debe ser una fecha ISO válida' })
  date_from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'date_to debe ser una fecha ISO válida' })
  date_to?: string;
}
