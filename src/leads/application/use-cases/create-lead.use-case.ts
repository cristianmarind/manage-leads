import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateLeadDto } from '../dtos/create-lead.dto';
import { Lead } from '../../domain/lead';
import { type ILeadRepository, LEAD_REPOSITORY } from '../../domain/lead.repository.port';

@Injectable()
export class CreateLeadUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leads: ILeadRepository,
  ) {}

  async execute(dto: CreateLeadDto): Promise<Lead> {
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
    });

    return this.leads.save(lead);
  }
}
