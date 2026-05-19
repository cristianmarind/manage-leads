import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type ILeadRepository, LEAD_REPOSITORY } from '../../domain/lead.repository.port';
import { Lead } from '../../domain/lead';
import { UpdateLeadDto } from '../dtos/update-lead.dto';

@Injectable()
export class UpdateLeadUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leads: ILeadRepository,
  ) {}

  async execute(id: string, dto: UpdateLeadDto): Promise<Lead> {
    const lead = await this.leads.findById(id);
    if (!lead) {
      throw new NotFoundException(`Lead con id "${id}" no encontrado`);
    }

    if (dto.email !== undefined && dto.email !== lead.email) {
      const duplicate = await this.leads.findByEmail(dto.email, true);
      if (duplicate) {
        throw new ConflictException('Ya existe un lead con ese email');
      }
    }

    if (dto.nombre !== undefined) lead.nombre = dto.nombre;
    if (dto.email !== undefined) lead.email = dto.email;
    if (dto.telefono !== undefined) lead.telefono = dto.telefono ?? null;
    if (dto.fuente !== undefined) lead.fuente = dto.fuente;
    if (dto.producto_interes !== undefined) lead.producto_interes = dto.producto_interes ?? null;
    if (dto.presupuesto !== undefined) lead.presupuesto = dto.presupuesto ?? null;

    return this.leads.update(lead);
  }
}
