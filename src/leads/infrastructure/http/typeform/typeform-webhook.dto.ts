import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TypeformField {
  @ApiProperty({ example: 'field_01' })
  id!: string;

  @ApiProperty({ example: 'nombre', description: 'Referencia del campo en Typeform' })
  ref!: string;

  @ApiProperty({ example: 'short_text' })
  type!: string;
}

export class TypeformChoice {
  @ApiPropertyOptional({ example: 'choice_01' })
  id?: string;

  @ApiProperty({ example: 'instagram' })
  label!: string;
}

export class TypeformAnswer {
  @ApiProperty({ type: () => TypeformField })
  field!: TypeformField;

  @ApiProperty({ example: 'text', description: 'text | email | phone_number | choice | number' })
  type!: string;

  @ApiPropertyOptional({ example: 'Juan Pérez' })
  text?: string;

  @ApiPropertyOptional({ example: 'juan@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: '+52 555-1234' })
  phone_number?: string;

  @ApiPropertyOptional({ type: () => TypeformChoice })
  choice?: TypeformChoice;

  @ApiPropertyOptional({ example: 1500 })
  number?: number;
}

export class TypeformFormResponse {
  @ApiProperty({ example: 'form_abc123' })
  form_id!: string;

  @ApiProperty({ example: 'token_xyz' })
  token!: string;

  @ApiProperty({ example: '2026-05-19T12:00:00Z' })
  submitted_at!: string;

  @ApiProperty({ type: [TypeformAnswer] })
  answers!: TypeformAnswer[];
}

export class TypeformWebhookDto {
  @ApiProperty({ example: 'evt_01' })
  event_id!: string;

  @ApiProperty({ example: 'form_response' })
  event_type!: string;

  @ApiProperty({ type: () => TypeformFormResponse })
  form_response!: TypeformFormResponse;
}
