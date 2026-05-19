import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Fuente } from '../../domain/fuente.enum';

export class CreateLeadDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  nombre!: string;

  @IsNotEmpty({ message: 'El email es obligatorio' })
  @IsEmail({}, { message: 'El formato del email no es válido' })
  email!: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsNotEmpty({ message: 'La fuente es obligatoria' })
  @IsEnum(Fuente, {
    message: `La fuente debe ser uno de: ${Object.values(Fuente).join(', ')}`,
  })
  fuente!: Fuente;

  @IsOptional()
  @IsString()
  producto_interes?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El presupuesto debe ser un número' })
  @Min(0, { message: 'El presupuesto no puede ser negativo' })
  presupuesto?: number;
}
