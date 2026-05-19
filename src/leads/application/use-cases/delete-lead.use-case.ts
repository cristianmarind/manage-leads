import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { type ILeadRepository, LEAD_REPOSITORY } from '../../domain/lead.repository.port';
import { type ILeadLogger, LEAD_LOGGER } from '../../domain/lead-logger.port';

@Injectable()
export class DeleteLeadUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leads: ILeadRepository,
    @Optional() @Inject(LEAD_LOGGER)
    private readonly logger: ILeadLogger | null = null,
  ) {}

  async execute(id: string, actorId?: string): Promise<void> {
    const lead = await this.leads.findById(id);
    if (!lead) {
      throw new NotFoundException(`Lead con id "${id}" no encontrado`);
    }

    await this.leads.softDelete(id, actorId ?? null);

    this.logger?.log('lead.deleted', {
      lead_id: id,
      nombre: lead.nombre,
      email: lead.email,
      actor_id: actorId ?? null,
    });
  }
}
