import { GetLeadAiSummaryUseCase } from './get-lead-ai-summary.use-case';
import { ILeadRepository } from '../../domain/lead.repository.port';
import { IAiSummaryProvider } from '../../domain/ai-summary.port';
import { Lead } from '../../domain/lead';
import { Fuente } from '../../domain/fuente.enum';
import { AiSummaryDto } from '../dtos/ai-summary.dto';

const buildLead = (overrides: Partial<ConstructorParameters<typeof Lead>[0]> = {}): Lead =>
  new Lead({
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    fuente: Fuente.INSTAGRAM,
    presupuesto: 1000,
    ...overrides,
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

const buildAiProvider = (): jest.Mocked<IAiSummaryProvider> => ({
  generateLeadSummary: jest.fn(),
});

describe('GetLeadAiSummaryUseCase', () => {
  let useCase: GetLeadAiSummaryUseCase;
  let repo: jest.Mocked<ILeadRepository>;
  let ai: jest.Mocked<IAiSummaryProvider>;

  beforeEach(() => {
    repo = buildRepo();
    ai = buildAiProvider();
    useCase = new GetLeadAiSummaryUseCase(repo, ai);
  });

  it('retorna el resumen y el conteo de leads analizados', async () => {
    const leads = [buildLead(), buildLead({ id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', email: 'otro@example.com' })];
    repo.findAllByFilter.mockResolvedValue(leads);
    ai.generateLeadSummary.mockResolvedValue('Resumen ejecutivo de los leads.');

    const dto: AiSummaryDto = { fuente: Fuente.INSTAGRAM };
    const result = await useCase.execute(dto);

    expect(result.summary).toBe('Resumen ejecutivo de los leads.');
    expect(result.leads_analyzed).toBe(2);
  });

  it('pasa los leads al proveedor de IA', async () => {
    const leads = [buildLead()];
    repo.findAllByFilter.mockResolvedValue(leads);
    ai.generateLeadSummary.mockResolvedValue('Resumen.');

    await useCase.execute({});

    expect(ai.generateLeadSummary).toHaveBeenCalledWith(leads);
  });

  it('retorna mensaje de sin resultados sin llamar a la IA cuando no hay leads', async () => {
    repo.findAllByFilter.mockResolvedValue([]);

    const result = await useCase.execute({});

    expect(result.leads_analyzed).toBe(0);
    expect(result.summary).toMatch(/no se encontraron/i);
    expect(ai.generateLeadSummary).not.toHaveBeenCalled();
  });

  it('convierte date_from y date_to de string a Date al llamar al repositorio', async () => {
    repo.findAllByFilter.mockResolvedValue([]);

    const dto: AiSummaryDto = { date_from: '2026-01-01', date_to: '2026-05-31' };
    await useCase.execute(dto);

    const call = repo.findAllByFilter.mock.calls[0][0];
    expect(call.date_from).toBeInstanceOf(Date);
    expect(call.date_to).toBeInstanceOf(Date);
  });
});
