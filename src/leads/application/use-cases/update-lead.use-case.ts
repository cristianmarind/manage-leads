import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { type ILeadRepository, LEAD_REPOSITORY } from '../../domain/lead.repository.port';
import { type ILeadLogger, LEAD_LOGGER } from '../../domain/lead-logger.port';
import { Lead } from '../../domain/lead';
import { UpdateLeadDto } from '../dtos/update-lead.dto';

@Injectable()
export class UpdateLeadUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leads: ILeadRepository,
    @Optional() @Inject(LEAD_LOGGER)
    private readonly logger: ILeadLogger | null = null,
  ) {}

  async execute(id: string, dto: UpdateLeadDto, actorId?: string): Promise<Lead> {
    const lead = await this.leads.findById(id);
    if (!lead) {
      throw new NotFoundException(`Lead con id "${id}" no encontrado`);
    }

    if (dto.email !== undefined && dto.email !== lead.email) {
      const duplicate = await this.leads.findByEmail(dto.email, true);
      if (duplicate) {
        throw new ConflictException('Ya existe un lead con ese email');
      }
    }

    const updatedFields: string[] = [];
    if (dto.nombre !== undefined) { lead.nombre = dto.nombre; updatedFields.push('nombre'); }
    if (dto.email !== undefined) { lead.email = dto.email; updatedFields.push('email'); }
    if (dto.telefono !== undefined) { lead.telefono = dto.telefono ?? null; updatedFields.push('telefono'); }
    if (dto.fuente !== undefined) { lead.fuente = dto.fuente; updatedFields.push('fuente'); }
    if (dto.producto_interes !== undefined) { lead.producto_interes = dto.producto_interes ?? null; updatedFields.push('producto_interes'); }
    if (dto.presupuesto !== undefined) { lead.presupuesto = dto.presupuesto ?? null; updatedFields.push('presupuesto'); }

    lead.updater_id = actorId ?? null;

    const updated = await this.leads.update(lead);

    this.logger?.log('lead.updated', {
      lead_id: id,
      campos_modificados: updatedFields,
      actor_id: actorId ?? null,
    });

    return updated;
  }
}
