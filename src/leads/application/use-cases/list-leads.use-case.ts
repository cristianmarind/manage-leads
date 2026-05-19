import { Inject, Injectable } from '@nestjs/common';
import {
  type ILeadRepository,
  LEAD_REPOSITORY,
  type PaginatedResult,
} from '../../domain/lead.repository.port';
import { Lead } from '../../domain/lead';
import { ListLeadsQueryDto } from '../dtos/list-leads.query.dto';

@Injectable()
export class ListLeadsUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leads: ILeadRepository,
  ) {}

  async execute(query: ListLeadsQueryDto): Promise<PaginatedResult<Lead>> {
    return this.leads.findAll({
      page: query.page,
      limit: query.limit,
      fuente: query.fuente,
      date_from: query.date_from ? new Date(query.date_from) : undefined,
      date_to: query.date_to ? new Date(query.date_to) : undefined,
    });
  }
}
