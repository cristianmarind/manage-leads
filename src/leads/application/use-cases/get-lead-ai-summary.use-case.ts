import { Inject, Injectable } from '@nestjs/common';
import { type ILeadRepository, LEAD_REPOSITORY } from '../../domain/lead.repository.port';
import { type IAiSummaryProvider, AI_SUMMARY_PORT } from '../../domain/ai-summary.port';
import { AiSummaryDto } from '../dtos/ai-summary.dto';

export interface AiSummaryResult {
  summary: string;
  leads_analyzed: number;
}

@Injectable()
export class GetLeadAiSummaryUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leads: ILeadRepository,
    @Inject(AI_SUMMARY_PORT)
    private readonly ai: IAiSummaryProvider,
  ) {}

  async execute(dto: AiSummaryDto): Promise<AiSummaryResult> {
    const leads = await this.leads.findAllByFilter({
      fuente: dto.fuente,
      date_from: dto.date_from ? new Date(dto.date_from) : undefined,
      date_to: dto.date_to ? new Date(dto.date_to) : undefined,
    });

    if (leads.length === 0) {
      return {
        summary: 'No se encontraron leads con los filtros proporcionados.',
        leads_analyzed: 0,
      };
    }

    const summary = await this.ai.generateLeadSummary(leads);
    return { summary, leads_analyzed: leads.length };
  }
}
