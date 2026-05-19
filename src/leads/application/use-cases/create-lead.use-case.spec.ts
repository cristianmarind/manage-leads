import { ConflictException } from '@nestjs/common';
import { CreateLeadUseCase } from './create-lead.use-case';
import { ILeadRepository } from '../../domain/lead.repository.port';
import { Lead } from '../../domain/lead';
import { Fuente } from '../../domain/fuente.enum';
import { CreateLeadDto } from '../dtos/create-lead.dto';

const buildLead = (overrides: Partial<ConstructorParameters<typeof Lead>[0]> = {}): Lead =>
  new Lead({
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    fuente: Fuente.INSTAGRAM,
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

describe('CreateLeadUseCase', () => {
  let useCase: CreateLeadUseCase;
  let repo: jest.Mocked<ILeadRepository>;

  const dto: CreateLeadDto = {
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    fuente: Fuente.INSTAGRAM,
    telefono: '555-1234',
    presupuesto: 1500,
  };

  beforeEach(() => {
    repo = buildRepo();
    useCase = new CreateLeadUseCase(repo);
  });

  it('crea y retorna el lead cuando el email no existe', async () => {
    const saved = buildLead();
    repo.findByEmail.mockResolvedValue(null);
    repo.save.mockResolvedValue(saved);

    const result = await useCase.execute(dto);

    expect(repo.findByEmail).toHaveBeenCalledWith(dto.email, true);
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(result).toBe(saved);
  });

  it('lanza ConflictException cuando el email ya existe', async () => {
    repo.findByEmail.mockResolvedValue(buildLead());

    await expect(useCase.execute(dto)).rejects.toThrow(ConflictException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('mapea campos opcionales a null cuando no se proporcionan', async () => {
    const dtoSinOpcionales: CreateLeadDto = {
      nombre: 'Ana López',
      email: 'ana@example.com',
      fuente: Fuente.FACEBOOK,
    };
    repo.findByEmail.mockResolvedValue(null);
    repo.save.mockImplementation(async (lead) => lead);

    const result = await useCase.execute(dtoSinOpcionales);

    expect(result.telefono).toBeNull();
    expect(result.producto_interes).toBeNull();
    expect(result.presupuesto).toBeNull();
  });

  it('asigna un UUID al nuevo lead', async () => {
    repo.findByEmail.mockResolvedValue(null);
    repo.save.mockImplementation(async (lead) => lead);

    const result = await useCase.execute(dto);

    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});
