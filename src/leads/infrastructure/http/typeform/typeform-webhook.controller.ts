import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { validate } from 'class-validator';
import { CreateLeadUseCase } from '../../../application/use-cases/create-lead.use-case';
import { LeadResponseDto } from '../../../application/dtos/lead-response.dto';
import { TypeformWebhookDto } from './typeform-webhook.dto';
import { TypeformWebhookMapper } from './typeform-webhook.mapper';

@ApiTags('leads')
@Controller('leads')
export class TypeformWebhookController {
  constructor(
    private readonly mapper: TypeformWebhookMapper,
    private readonly createLeadUseCase: CreateLeadUseCase,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Webhook de Typeform — crea un lead desde un form response' })
  @ApiBody({
    type: TypeformWebhookDto,
    examples: {
      completo: {
        summary: 'Payload con todos los campos',
        value: {
          event_id: 'evt_01',
          event_type: 'form_response',
          form_response: {
            form_id: 'form_abc123',
            token: 'tkn_xyz',
            submitted_at: '2026-05-19T12:00:00Z',
            answers: [
              { field: { id: 'f1', ref: 'nombre', type: 'short_text' }, type: 'text', text: 'Juan Pérez' },
              { field: { id: 'f2', ref: 'email', type: 'email' }, type: 'email', email: 'juan@example.com' },
              { field: { id: 'f3', ref: 'telefono', type: 'phone_number' }, type: 'phone_number', phone_number: '+52 555-1234' },
              { field: { id: 'f4', ref: 'fuente', type: 'multiple_choice' }, type: 'choice', choice: { label: 'instagram' } },
              { field: { id: 'f5', ref: 'producto_interes', type: 'short_text' }, type: 'text', text: 'Plan Pro' },
              { field: { id: 'f6', ref: 'presupuesto', type: 'number' }, type: 'number', number: 1500 },
            ],
          },
        },
      },
      minimo: {
        summary: 'Payload con solo campos obligatorios',
        value: {
          event_id: 'evt_02',
          event_type: 'form_response',
          form_response: {
            form_id: 'form_abc123',
            token: 'tkn_xyz',
            submitted_at: '2026-05-19T12:00:00Z',
            answers: [
              { field: { id: 'f1', ref: 'nombre', type: 'short_text' }, type: 'text', text: 'Ana López' },
              { field: { id: 'f2', ref: 'email', type: 'email' }, type: 'email', email: 'ana@example.com' },
              { field: { id: 'f4', ref: 'fuente', type: 'multiple_choice' }, type: 'choice', choice: { label: 'referido' } },
            ],
          },
        },
      },
    },
  })
  @ApiCreatedResponse({ type: LeadResponseDto })
  @ApiBadRequestResponse({ description: 'Payload inválido o campos obligatorios faltantes' })
  @ApiConflictResponse({ description: 'Ya existe un lead con ese email' })
  async handle(@Body() payload: TypeformWebhookDto) {
    const dto = this.mapper.map(payload);

    const errors = await validate(dto);
    if (errors.length > 0) {
      const messages = errors
        .flatMap((e) => Object.values(e.constraints ?? {}));
      throw new BadRequestException(messages);
    }

    return this.createLeadUseCase.execute(dto);
  }
}
