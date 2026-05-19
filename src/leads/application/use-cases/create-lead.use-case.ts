import { ConflictException, Inject, Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateLeadDto } from '../dtos/create-lead.dto';
import { Lead } from '../../domain/lead';
import { type ILeadRepository, LEAD_REPOSITORY } from '../../domain/lead.repository.port';
import { type ILeadLogger, LEAD_LOGGER } from '../../domain/lead-logger.port';

@Injectable()
export class CreateLeadUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leads: ILeadRepository,
    @Optional() @Inject(LEAD_LOGGER)
    private readonly logger: ILeadLogger | null = null,
  ) {}

  async execute(dto: CreateLeadDto, actorId?: string): Promise<Lead> {
    const existing = await this.leads.findByEmail(dto.email, true);
    if (existing) {
      throw new ConflictException('Ya existe un lead con ese email');
    }

    const lead = new Lead({
      id: randomUUID(),
      nombre: dto.nombre,
      email: dto.email,
      telefono: dto.telefono ?? null,
      fuente: dto.fuente,
      producto_interes: dto.producto_interes ?? null,
      presupuesto: dto.presupuesto ?? null,
      creator_id: actorId ?? null,
    });

    const saved = await this.leads.save(lead);

    this.logger?.log('lead.created', {
      lead_id: saved.id,
      nombre: saved.nombre,
      email: saved.email,
      fuente: saved.fuente,
      presupuesto: saved.presupuesto,
      actor_id: actorId ?? null,
    });

    return saved;
  }
}
