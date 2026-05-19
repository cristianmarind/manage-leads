import { Inject, Injectable, Optional } from '@nestjs/common';
import { type ILeadRepository, LEAD_REPOSITORY, type LeadStats } from '../../domain/lead.repository.port';
import { type ILeadLogger, LEAD_LOGGER } from '../../domain/lead-logger.port';

@Injectable()
export class GetLeadStatsUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leads: ILeadRepository,
    @Optional() @Inject(LEAD_LOGGER)
    private readonly logger: ILeadLogger | null = null,
  ) {}

  async execute(actorId?: string): Promise<LeadStats> {
    const stats = await this.leads.getStats();

    this.logger?.log('lead.stats', {
      actor_id: actorId ?? null,
      total: stats.total,
    });

    return stats;
  }
}
