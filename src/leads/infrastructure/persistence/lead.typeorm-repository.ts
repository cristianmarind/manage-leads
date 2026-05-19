import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadOrmEntity } from './lead.orm-entity';
import { Lead } from '../../domain/lead';
import {
  ILeadRepository,
  LeadStats,
  ListLeadsFilter,
  PaginatedResult,
  SummaryFilter,
} from '../../domain/lead.repository.port';
import { Fuente } from '../../domain/fuente.enum';

@Injectable()
export class LeadTypeormRepository implements ILeadRepository {
  constructor(
    @InjectRepository(LeadOrmEntity)
    private readonly repo: Repository<LeadOrmEntity>,
  ) {}

  async save(lead: Lead): Promise<Lead> {
    const saved = await this.repo.save(this.toOrm(lead));
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Lead | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? this.toDomain(orm) : null;
  }

  async findByEmail(email: string, includeDeleted = false): Promise<Lead | null> {
    const orm = await this.repo.findOne({
      where: { email },
      withDeleted: includeDeleted,
    });
    return orm ? this.toDomain(orm) : null;
  }

  async findAll(filter: ListLeadsFilter): Promise<PaginatedResult<Lead>> {
    const qb = this.repo.createQueryBuilder('lead');

    if (filter.fuente) {
      qb.andWhere('lead.fuente = :fuente', { fuente: filter.fuente });
    }
    if (filter.date_from) {
      qb.andWhere('lead.created_at >= :date_from', { date_from: filter.date_from });
    }
    if (filter.date_to) {
      qb.andWhere('lead.created_at <= :date_to', { date_to: filter.date_to });
    }

    qb.orderBy('lead.created_at', 'DESC')
      .skip((filter.page - 1) * filter.limit)
      .take(filter.limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items.map((item) => this.toDomain(item)),
      total,
      page: filter.page,
      limit: filter.limit,
    };
  }

  async update(lead: Lead): Promise<Lead> {
    const saved = await this.repo.save(this.toOrm(lead));
    return this.toDomain(saved);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async findAllByFilter(filter: SummaryFilter): Promise<Lead[]> {
    const qb = this.repo.createQueryBuilder('lead');

    if (filter.fuente) {
      qb.andWhere('lead.fuente = :fuente', { fuente: filter.fuente });
    }
    if (filter.date_from) {
      qb.andWhere('lead.created_at >= :date_from', { date_from: filter.date_from });
    }
    if (filter.date_to) {
      qb.andWhere('lead.created_at <= :date_to', { date_to: filter.date_to });
    }

    qb.orderBy('lead.created_at', 'DESC');

    const items = await qb.getMany();
    return items.map((item) => this.toDomain(item));
  }

  async getStats(): Promise<LeadStats> {
    const [aggregate, porFuenteRaw] = await Promise.all([
      this.repo
        .createQueryBuilder('lead')
        .select('COUNT(*)', 'total')
        .addSelect('AVG(lead.presupuesto)', 'promedio_presupuesto')
        .addSelect(
          `COUNT(CASE WHEN lead.created_at >= NOW() - INTERVAL '7 days' THEN 1 END)`,
          'ultimos_7_dias',
        )
        .getRawOne<{ total: string; promedio_presupuesto: string | null; ultimos_7_dias: string }>(),
      this.repo
        .createQueryBuilder('lead')
        .select('lead.fuente', 'fuente')
        .addSelect('COUNT(*)', 'count')
        .groupBy('lead.fuente')
        .getRawMany<{ fuente: Fuente; count: string }>(),
    ]);

    const por_fuente = Object.fromEntries(
      Object.values(Fuente).map((f) => [f, 0]),
    ) as Record<string, number>;
    porFuenteRaw.forEach((r) => { por_fuente[r.fuente] = Number(r.count); });

    return {
      total: Number(aggregate!.total),
      por_fuente,
      promedio_presupuesto:
        aggregate!.promedio_presupuesto !== null
          ? Number(Number(aggregate!.promedio_presupuesto).toFixed(2))
          : null,
      ultimos_7_dias: Number(aggregate!.ultimos_7_dias),
    };
  }

  private toDomain(orm: LeadOrmEntity): Lead {
    return new Lead({
      id: orm.id,
      nombre: orm.nombre,
      email: orm.email,
      telefono: orm.telefono,
      fuente: orm.fuente,
      producto_interes: orm.producto_interes,
      presupuesto: orm.presupuesto !== null ? Number(orm.presupuesto) : null,
      created_at: orm.created_at,
      updated_at: orm.updated_at,
      deleted_at: orm.deleted_at,
    });
  }

  private toOrm(lead: Lead): LeadOrmEntity {
    const orm = new LeadOrmEntity();
    orm.id = lead.id;
    orm.nombre = lead.nombre;
    orm.email = lead.email;
    orm.telefono = lead.telefono;
    orm.fuente = lead.fuente;
    orm.producto_interes = lead.producto_interes;
    orm.presupuesto = lead.presupuesto;
    orm.created_at = lead.created_at;
    orm.updated_at = lead.updated_at;
    orm.deleted_at = lead.deleted_at;
    return orm;
  }
}
