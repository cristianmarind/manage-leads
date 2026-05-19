import { Inject, Injectable } from '@nestjs/common';
import { type ILeadRepository, LEAD_REPOSITORY, type LeadStats } from '../../domain/lead.repository.port';

@Injectable()
export class GetLeadStatsUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leads: ILeadRepository,
  ) {}

  execute(): Promise<LeadStats> {
    return this.leads.getStats();
  }
}
