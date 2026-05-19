import { GetLeadStatsUseCase } from './get-lead-stats.use-case';
import { ILeadRepository, LeadStats } from '../../domain/lead.repository.port';
import { Fuente } from '../../domain/fuente.enum';

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

describe('GetLeadStatsUseCase', () => {
  let useCase: GetLeadStatsUseCase;
  let repo: jest.Mocked<ILeadRepository>;

  beforeEach(() => {
    repo = buildRepo();
    useCase = new GetLeadStatsUseCase(repo);
  });

  it('retorna las estadísticas del repositorio', async () => {
    const stats: LeadStats = {
      total: 42,
      por_fuente: {
        [Fuente.INSTAGRAM]: 20,
        [Fuente.FACEBOOK]: 10,
        [Fuente.LANDING_PAGE]: 7,
        [Fuente.REFERIDO]: 3,
        [Fuente.OTRO]: 2,
      },
      promedio_presupuesto: 1250.5,
      ultimos_7_dias: 8,
    };
    repo.getStats.mockResolvedValue(stats);

    const result = await useCase.execute();

    expect(repo.getStats).toHaveBeenCalledTimes(1);
    expect(result).toBe(stats);
  });

  it('retorna promedio_presupuesto null cuando no hay presupuestos', async () => {
    const stats: LeadStats = {
      total: 5,
      por_fuente: Object.fromEntries(Object.values(Fuente).map((f) => [f, 0])),
      promedio_presupuesto: null,
      ultimos_7_dias: 2,
    };
    repo.getStats.mockResolvedValue(stats);

    const result = await useCase.execute();

    expect(result.promedio_presupuesto).toBeNull();
  });
});
