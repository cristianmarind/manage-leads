import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { type ILeadRepository, LEAD_REPOSITORY } from '../../domain/lead.repository.port';
import { type ILeadLogger, LEAD_LOGGER } from '../../domain/lead-logger.port';
import { Lead } from '../../domain/lead';

@Injectable()
export class GetLeadUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leads: ILeadRepository,
    @Optional() @Inject(LEAD_LOGGER)
    private readonly logger: ILeadLogger | null = null,
  ) {}

  async execute(id: string, actorId?: string): Promise<Lead> {
    const lead = await this.leads.findById(id);
    if (!lead) {
      throw new NotFoundException(`Lead con id "${id}" no encontrado`);
    }

    this.logger?.log('lead.get', {
      lead_id: id,
      actor_id: actorId ?? null,
    });

    return lead;
  }
}
