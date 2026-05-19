import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { type ILeadRepository, LEAD_REPOSITORY } from '../../domain/lead.repository.port';
import { Lead } from '../../domain/lead';

@Injectable()
export class GetLeadUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leads: ILeadRepository,
  ) {}

  async execute(id: string): Promise<Lead> {
    const lead = await this.leads.findById(id);
    if (!lead) {
      throw new NotFoundException(`Lead con id "${id}" no encontrado`);
    }
    return lead;
  }
}
