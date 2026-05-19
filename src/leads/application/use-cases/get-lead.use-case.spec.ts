import { NotFoundException } from '@nestjs/common';
import { GetLeadUseCase } from './get-lead.use-case';
import { ILeadRepository } from '../../domain/lead.repository.port';
import { Lead } from '../../domain/lead';
import { Fuente } from '../../domain/fuente.enum';

const LEAD_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

const buildLead = (): Lead =>
  new Lead({
    id: LEAD_ID,
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

describe('GetLeadUseCase', () => {
  let useCase: GetLeadUseCase;
  let repo: jest.Mocked<ILeadRepository>;

  beforeEach(() => {
    repo = buildRepo();
    useCase = new GetLeadUseCase(repo);
  });

  it('retorna el lead cuando existe', async () => {
    const lead = buildLead();
    repo.findById.mockResolvedValue(lead);

    const result = await useCase.execute(LEAD_ID);

    expect(repo.findById).toHaveBeenCalledWith(LEAD_ID);
    expect(result).toBe(lead);
  });

  it('lanza NotFoundException cuando el lead no existe', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute(LEAD_ID)).rejects.toThrow(NotFoundException);
  });
});
