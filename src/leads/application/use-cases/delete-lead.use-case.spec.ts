import { NotFoundException } from '@nestjs/common';
import { DeleteLeadUseCase } from './delete-lead.use-case';
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

describe('DeleteLeadUseCase', () => {
  let useCase: DeleteLeadUseCase;
  let repo: jest.Mocked<ILeadRepository>;

  beforeEach(() => {
    repo = buildRepo();
    useCase = new DeleteLeadUseCase(repo);
  });

  it('llama softDelete con el id correcto cuando el lead existe', async () => {
    repo.findById.mockResolvedValue(buildLead());
    repo.softDelete.mockResolvedValue(undefined);

    await useCase.execute(LEAD_ID);

    expect(repo.softDelete).toHaveBeenCalledWith(LEAD_ID);
    expect(repo.softDelete).toHaveBeenCalledTimes(1);
  });

  it('lanza NotFoundException cuando el lead no existe', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute(LEAD_ID)).rejects.toThrow(NotFoundException);
    expect(repo.softDelete).not.toHaveBeenCalled();
  });

  it('retorna void al completarse correctamente', async () => {
    repo.findById.mockResolvedValue(buildLead());
    repo.softDelete.mockResolvedValue(undefined);

    const result = await useCase.execute(LEAD_ID);

    expect(result).toBeUndefined();
  });
});
