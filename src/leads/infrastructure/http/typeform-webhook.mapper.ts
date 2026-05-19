import { Injectable } from '@nestjs/common';
import { CreateLeadDto } from '../../application/dtos/create-lead.dto';
import { Fuente } from '../../domain/fuente.enum';
import { TypeformAnswer, TypeformWebhookDto } from './typeform-webhook.dto';

@Injectable()
export class TypeformWebhookMapper {
  map(payload: TypeformWebhookDto): CreateLeadDto {
    const answers = payload.form_response?.answers ?? [];
    const find = (ref: string): TypeformAnswer | undefined =>
      answers.find((a) => a.field?.ref === ref);

    const dto = new CreateLeadDto();

    const nombre = find('nombre');
    if (nombre?.text) dto.nombre = nombre.text;

    const email = find('email');
    if (email?.email) dto.email = email.email;

    const telefono = find('telefono');
    if (telefono?.phone_number) dto.telefono = telefono.phone_number;

    const fuente = find('fuente');
    if (fuente?.choice?.label) dto.fuente = fuente.choice.label as Fuente;

    const producto = find('producto_interes');
    if (producto?.text) dto.producto_interes = producto.text;

    const presupuesto = find('presupuesto');
    if (presupuesto?.number !== undefined) dto.presupuesto = presupuesto.number;

    return dto;
  }
}
