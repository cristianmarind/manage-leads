import { Lead } from './lead';
import { Fuente } from './fuente.enum';

export const LEAD_REPOSITORY = Symbol('LEAD_REPOSITORY');

export interface ListLeadsFilter {
  fuente?: Fuente;
  date_from?: Date;
  date_to?: Date;
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface LeadStats {
  total: number;
  por_fuente: Record<string, number>;
  promedio_presupuesto: number | null;
  ultimos_7_dias: number;
}

export type SummaryFilter = Pick<ListLeadsFilter, 'fuente' | 'date_from' | 'date_to'>;

export interface ILeadRepository {
  save(lead: Lead): Promise<Lead>;
  findById(id: string): Promise<Lead | null>;
  findByEmail(email: string, includeDeleted?: boolean): Promise<Lead | null>;
  findAll(filter: ListLeadsFilter): Promise<PaginatedResult<Lead>>;
  findAllByFilter(filter: SummaryFilter): Promise<Lead[]>;
  update(lead: Lead): Promise<Lead>;
  softDelete(id: string): Promise<void>;
  getStats(): Promise<LeadStats>;
}
