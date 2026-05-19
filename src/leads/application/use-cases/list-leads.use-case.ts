import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  type ILeadRepository,
  LEAD_REPOSITORY,
  type PaginatedResult,
} from '../../domain/lead.repository.port';
import { type ILeadLogger, LEAD_LOGGER } from '../../domain/lead-logger.port';
import { Lead } from '../../domain/lead';
import { ListLeadsQueryDto } from '../dtos/list-leads.query.dto';

@Injectable()
export class ListLeadsUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leads: ILeadRepository,
    @Optional() @Inject(LEAD_LOGGER)
    private readonly logger: ILeadLogger | null = null,
  ) {}

  async execute(query: ListLeadsQueryDto, actorId?: string): Promise<PaginatedResult<Lead>> {
    const result = await this.leads.findAll({
      page: query.page,
      limit: query.limit,
      fuente: query.fuente,
      date_from: query.date_from ? new Date(query.date_from) : undefined,
      date_to: query.date_to ? new Date(query.date_to) : undefined,
    });

    this.logger?.log('lead.list', {
      actor_id: actorId ?? null,
      fuente: query.fuente ?? null,
      page: query.page,
      limit: query.limit,
      total: result.total,
    });

    return result;
  }
}
