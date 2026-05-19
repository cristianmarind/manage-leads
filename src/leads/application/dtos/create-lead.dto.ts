import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'Juan Pérez', minLength: 2 })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  nombre!: string;

  @ApiProperty({ example: 'juan@example.com' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  @IsEmail({}, { message: 'El formato del email no es válido' })
  email!: string;

  @ApiPropertyOptional({ example: '555-1234' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({ enum: Fuente, example: Fuente.INSTAGRAM })
  @IsNotEmpty({ message: 'La fuente es obligatoria' })
  @IsEnum(Fuente, {
    message: `La fuente debe ser uno de: ${Object.values(Fuente).join(', ')}`,
  })
  fuente!: Fuente;

  @ApiPropertyOptional({ example: 'Plan Pro' })
  @IsOptional()
  @IsString()
  producto_interes?: string;

  @ApiPropertyOptional({ example: 1500, minimum: 0, description: 'Presupuesto en USD' })
  @IsOptional()
  @IsNumber({}, { message: 'El presupuesto debe ser un número' })
  @Min(0, { message: 'El presupuesto no puede ser negativo' })
  presupuesto?: number;
}
