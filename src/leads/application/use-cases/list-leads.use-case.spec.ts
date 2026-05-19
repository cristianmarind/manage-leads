import { ListLeadsUseCase } from './list-leads.use-case';
import { ILeadRepository, PaginatedResult } from '../../domain/lead.repository.port';
import { Lead } from '../../domain/lead';
import { Fuente } from '../../domain/fuente.enum';
import { ListLeadsQueryDto } from '../dtos/list-leads.query.dto';

const buildLead = (): Lead =>
  new Lead({
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    fuente: Fuente.INSTAGRAM,
  });

const buildRepo = (): jest.Mocked<ILeadRepository> => ({
  save: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findAll: jest.fn(),
  findAllByFilter: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  getStats: jest.fn(),
});

const buildPaginatedResult = (data: Lead[] = []): PaginatedResult<Lead> => ({
  data,
  total: data.length,
  page: 1,
  limit: 20,
});

describe('ListLeadsUseCase', () => {
  let useCase: ListLeadsUseCase;
  let repo: jest.Mocked<ILeadRepository>;

  beforeEach(() => {
    repo = buildRepo();
    useCase = new ListLeadsUseCase(repo);
  });

  it('retorna el resultado paginado del repositorio', async () => {
    const expected = buildPaginatedResult([buildLead()]);
    repo.findAll.mockResolvedValue(expected);

    const query: ListLeadsQueryDto = { page: 1, limit: 20 };
    const result = await useCase.execute(query);

    expect(result).toBe(expected);
  });

  it('pasa los filtros opcionales al repositorio', async () => {
    repo.findAll.mockResolvedValue(buildPaginatedResult());

    const query: ListLeadsQueryDto = {
      page: 2,
      limit: 10,
      fuente: Fuente.FACEBOOK,
      date_from: '2026-01-01',
      date_to: '2026-06-30',
    };
    await useCase.execute(query);

    expect(repo.findAll).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      fuente: Fuente.FACEBOOK,
      date_from: new Date('2026-01-01'),
      date_to: new Date('2026-06-30'),
    });
  });

  it('convierte date_from y date_to de string a Date', async () => {
    repo.findAll.mockResolvedValue(buildPaginatedResult());

    await useCase.execute({ page: 1, limit: 20, date_from: '2026-03-15', date_to: '2026-05-01' });

    const call = repo.findAll.mock.calls[0][0];
    expect(call.date_from).toBeInstanceOf(Date);
    expect(call.date_to).toBeInstanceOf(Date);
  });

  it('pasa undefined en fechas cuando no se proporcionan', async () => {
    repo.findAll.mockResolvedValue(buildPaginatedResult());

    await useCase.execute({ page: 1, limit: 20 });

    const call = repo.findAll.mock.calls[0][0];
    expect(call.date_from).toBeUndefined();
    expect(call.date_to).toBeUndefined();
    expect(call.fuente).toBeUndefined();
  });
});
