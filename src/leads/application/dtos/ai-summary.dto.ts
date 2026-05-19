import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { Fuente } from '../../domain/fuente.enum';

export class AiSummaryDto {
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
