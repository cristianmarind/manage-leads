import { ConflictException, NotFoundException } from '@nestjs/common';
import { UpdateLeadUseCase } from './update-lead.use-case';
import { ILeadRepository } from '../../domain/lead.repository.port';
import { Lead } from '../../domain/lead';
import { Fuente } from '../../domain/fuente.enum';
import { UpdateLeadDto } from '../dtos/update-lead.dto';

const LEAD_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const OTHER_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const buildLead = (overrides: Partial<ConstructorParameters<typeof Lead>[0]> = {}): Lead =>
  new Lead({
    id: LEAD_ID,
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

describe('UpdateLeadUseCase', () => {
  let useCase: UpdateLeadUseCase;
  let repo: jest.Mocked<ILeadRepository>;

  beforeEach(() => {
    repo = buildRepo();
    useCase = new UpdateLeadUseCase(repo);
  });

  it('actualiza y retorna el lead modificado', async () => {
    const original = buildLead();
    const updated = buildLead({ nombre: 'Juan Actualizado', presupuesto: 2000 });
    repo.findById.mockResolvedValue(original);
    repo.update.mockResolvedValue(updated);

    const dto: UpdateLeadDto = { nombre: 'Juan Actualizado', presupuesto: 2000 };
    const result = await useCase.execute(LEAD_ID, dto);

    expect(repo.update).toHaveBeenCalledTimes(1);
    expect(result).toBe(updated);
  });

  it('lanza NotFoundException cuando el lead no existe', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute(LEAD_ID, { nombre: 'Nuevo' })).rejects.toThrow(NotFoundException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('lanza ConflictException cuando el nuevo email ya pertenece a otro lead', async () => {
    repo.findById.mockResolvedValue(buildLead());
    repo.findByEmail.mockResolvedValue(buildLead({ id: OTHER_ID, email: 'otro@example.com' }));

    await expect(
      useCase.execute(LEAD_ID, { email: 'otro@example.com' }),
    ).rejects.toThrow(ConflictException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('no verifica unicidad cuando el email no cambia', async () => {
    const lead = buildLead();
    repo.findById.mockResolvedValue(lead);
    repo.update.mockResolvedValue(lead);

    await useCase.execute(LEAD_ID, { email: lead.email, nombre: 'Nuevo nombre' });

    expect(repo.findByEmail).not.toHaveBeenCalled();
  });

  it('actualiza solo los campos presentes en el DTO', async () => {
    const original = buildLead({ nombre: 'Original', presupuesto: 500 });
    repo.findById.mockResolvedValue(original);
    repo.update.mockImplementation(async (lead) => lead);

    await useCase.execute(LEAD_ID, { nombre: 'Modificado' });

    const savedLead: Lead = repo.update.mock.calls[0][0];
    expect(savedLead.nombre).toBe('Modificado');
    expect(savedLead.presupuesto).toBe(500);
  });
});
