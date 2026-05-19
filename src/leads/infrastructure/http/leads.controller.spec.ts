import { INestApplication, ValidationPipe, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { PassportStrategy } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ExtractJwt, Strategy } from 'passport-jwt';
import request from 'supertest';
import { LeadsController } from './leads.controller';
import { CreateLeadUseCase } from '../../application/use-cases/create-lead.use-case';
import { ListLeadsUseCase } from '../../application/use-cases/list-leads.use-case';
import { GetLeadUseCase } from '../../application/use-cases/get-lead.use-case';
import { UpdateLeadUseCase } from '../../application/use-cases/update-lead.use-case';
import { DeleteLeadUseCase } from '../../application/use-cases/delete-lead.use-case';
import { GetLeadStatsUseCase } from '../../application/use-cases/get-lead-stats.use-case';
import { GetLeadAiSummaryUseCase } from '../../application/use-cases/get-lead-ai-summary.use-case';
import {
  LEAD_REPOSITORY,
  type ILeadRepository,
  type LeadStats,
  type PaginatedResult,
} from '../../domain/lead.repository.port';
import { AI_SUMMARY_PORT, type IAiSummaryProvider } from '../../domain/ai-summary.port';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../../../auth/interfaces/jwt-payload.interface';
import { Lead } from '../../domain/lead';
import { Fuente } from '../../domain/fuente.enum';

const TEST_UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const OTHER_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const TEST_JWT_SECRET = 'test-secret-for-jest';
const TEST_USER: JwtPayload = {
  sub: 'user-test-uuid',
  email: 'admin@test.com',
  tokenVersion: 1,
  type: 'access',
};

class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    req.user = TEST_USER;
    return true;
  }
}

@Injectable()
class TestJwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: TEST_JWT_SECRET,
    });
  }
  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }
}

function buildRepo(): jest.Mocked<ILeadRepository> {
  return {
    save: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findAll: jest.fn(),
    findAllByFilter: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    getStats: jest.fn(),
  };
}

function buildAi(): jest.Mocked<IAiSummaryProvider> {
  return { generateLeadSummary: jest.fn() };
}

function buildLead(overrides: Partial<ConstructorParameters<typeof Lead>[0]> = {}): Lead {
  return new Lead({
    id: TEST_UUID,
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    fuente: Fuente.INSTAGRAM,
    telefono: null,
    producto_interes: null,
    presupuesto: null,
    creator_id: null,
    ...overrides,
  });
}

describe('LeadsController (integration)', () => {
  let app: INestApplication;
  let repo: jest.Mocked<ILeadRepository>;
  let ai: jest.Mocked<IAiSummaryProvider>;

  beforeAll(async () => {
    repo = buildRepo();
    ai = buildAi();

    const moduleRef = await Test.createTestingModule({
      controllers: [LeadsController],
      providers: [
        CreateLeadUseCase,
        ListLeadsUseCase,
        GetLeadUseCase,
        UpdateLeadUseCase,
        DeleteLeadUseCase,
        GetLeadStatsUseCase,
        GetLeadAiSummaryUseCase,
        { provide: LEAD_REPOSITORY, useValue: repo },
        { provide: AI_SUMMARY_PORT, useValue: ai },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(() => app.close());
  beforeEach(() => jest.resetAllMocks());

  // ──────────────────────────────────────────────
  // POST /leads
  // ──────────────────────────────────────────────
  describe('POST /leads', () => {
    const validBody = {
      nombre: 'Juan Pérez',
      email: 'juan@example.com',
      fuente: Fuente.INSTAGRAM,
    };

    it('201 — crea un lead y lo devuelve', async () => {
      const lead = buildLead();
      repo.findByEmail.mockResolvedValue(null);
      repo.save.mockResolvedValue(lead);

      const res = await request(app.getHttpServer())
        .post('/leads')
        .send(validBody)
        .expect(201);

      expect(res.body.email).toBe('juan@example.com');
      expect(res.body.fuente).toBe(Fuente.INSTAGRAM);
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('201 — crea un lead con todos los campos opcionales', async () => {
      const lead = buildLead({ telefono: '555-1234', producto_interes: 'Plan Pro', presupuesto: 1500 });
      repo.findByEmail.mockResolvedValue(null);
      repo.save.mockResolvedValue(lead);

      await request(app.getHttpServer())
        .post('/leads')
        .send({ ...validBody, telefono: '555-1234', producto_interes: 'Plan Pro', presupuesto: 1500 })
        .expect(201);

      const savedLead: Lead = repo.save.mock.calls[0][0];
      expect(savedLead.presupuesto).toBe(1500);
    });

    it('400 — nombre faltante', async () => {
      const { nombre: _n, ...body } = validBody;
      await request(app.getHttpServer()).post('/leads').send(body).expect(400);
    });

    it('400 — nombre menor de 2 caracteres', async () => {
      await request(app.getHttpServer())
        .post('/leads')
        .send({ ...validBody, nombre: 'A' })
        .expect(400);
    });

    it('400 — formato de email inválido', async () => {
      await request(app.getHttpServer())
        .post('/leads')
        .send({ ...validBody, email: 'no-es-un-email' })
        .expect(400);
    });

    it('400 — fuente con valor no permitido', async () => {
      await request(app.getHttpServer())
        .post('/leads')
        .send({ ...validBody, fuente: 'tiktok' })
        .expect(400);
    });

    it('400 — presupuesto negativo', async () => {
      await request(app.getHttpServer())
        .post('/leads')
        .send({ ...validBody, presupuesto: -100 })
        .expect(400);
    });

    it('409 — email ya registrado', async () => {
      repo.findByEmail.mockResolvedValue(buildLead());

      await request(app.getHttpServer()).post('/leads').send(validBody).expect(409);
    });
  });

  // ──────────────────────────────────────────────
  // GET /leads
  // ──────────────────────────────────────────────
  describe('GET /leads', () => {
    const paginatedResult: PaginatedResult<Lead> = {
      data: [buildLead()],
      total: 1,
      page: 1,
      limit: 20,
    };

    it('200 — devuelve leads paginados con valores por defecto', async () => {
      repo.findAll.mockResolvedValue(paginatedResult);

      const res = await request(app.getHttpServer()).get('/leads').expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.data).toHaveLength(1);
      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 20 }),
      );
    });

    it('200 — pasa filtros de paginación y fuente correctamente', async () => {
      repo.findAll.mockResolvedValue({ ...paginatedResult, page: 2, limit: 10 });

      await request(app.getHttpServer())
        .get('/leads')
        .query({ page: 2, limit: 10, fuente: Fuente.FACEBOOK })
        .expect(200);

      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, limit: 10, fuente: Fuente.FACEBOOK }),
      );
    });

    it('200 — pasa filtros de rango de fechas correctamente', async () => {
      repo.findAll.mockResolvedValue(paginatedResult);

      await request(app.getHttpServer())
        .get('/leads')
        .query({ date_from: '2026-01-01', date_to: '2026-05-01' })
        .expect(200);

      const call = repo.findAll.mock.calls[0][0];
      expect(call.date_from).toBeInstanceOf(Date);
      expect(call.date_to).toBeInstanceOf(Date);
    });
  });

  // ──────────────────────────────────────────────
  // GET /leads/stats
  // ──────────────────────────────────────────────
  describe('GET /leads/stats', () => {
    it('200 — devuelve las estadísticas de leads', async () => {
      const stats: LeadStats = {
        total: 10,
        por_fuente: { instagram: 5, facebook: 3, landing_page: 2, referido: 0, otro: 0 },
        promedio_presupuesto: 1250.5,
        ultimos_7_dias: 3,
      };
      repo.getStats.mockResolvedValue(stats);

      const res = await request(app.getHttpServer()).get('/leads/stats').expect(200);

      expect(res.body.total).toBe(10);
      expect(res.body.promedio_presupuesto).toBe(1250.5);
      expect(res.body.ultimos_7_dias).toBe(3);
      expect(res.body.por_fuente.instagram).toBe(5);
    });

    it('200 — devuelve promedio_presupuesto null cuando no hay presupuestos', async () => {
      repo.getStats.mockResolvedValue({
        total: 0,
        por_fuente: { instagram: 0, facebook: 0, landing_page: 0, referido: 0, otro: 0 },
        promedio_presupuesto: null,
        ultimos_7_dias: 0,
      });

      const res = await request(app.getHttpServer()).get('/leads/stats').expect(200);

      expect(res.body.promedio_presupuesto).toBeNull();
    });
  });

  // ──────────────────────────────────────────────
  // POST /leads/ai/summary
  // ──────────────────────────────────────────────
  describe('POST /leads/ai/summary', () => {
    it('200 — devuelve resumen cuando hay leads', async () => {
      repo.findAllByFilter.mockResolvedValue([buildLead(), buildLead({ id: OTHER_UUID })]);
      ai.generateLeadSummary.mockResolvedValue('Resumen ejecutivo: Instagram lidera con 100%.');

      const res = await request(app.getHttpServer())
        .post('/leads/ai/summary')
        .send({})
        .expect(200);

      expect(res.body.summary).toContain('Instagram');
      expect(res.body.leads_analyzed).toBe(2);
      expect(ai.generateLeadSummary).toHaveBeenCalledTimes(1);
    });

    it('200 — devuelve mensaje vacío cuando no hay leads con los filtros', async () => {
      repo.findAllByFilter.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .post('/leads/ai/summary')
        .send({ fuente: Fuente.OTRO })
        .expect(200);

      expect(res.body.leads_analyzed).toBe(0);
      expect(ai.generateLeadSummary).not.toHaveBeenCalled();
    });

    it('200 — pasa el filtro de fuente al repositorio', async () => {
      repo.findAllByFilter.mockResolvedValue([buildLead({ fuente: Fuente.REFERIDO })]);
      ai.generateLeadSummary.mockResolvedValue('Resumen de referidos.');

      await request(app.getHttpServer())
        .post('/leads/ai/summary')
        .send({ fuente: Fuente.REFERIDO })
        .expect(200);

      expect(repo.findAllByFilter).toHaveBeenCalledWith(
        expect.objectContaining({ fuente: Fuente.REFERIDO }),
      );
    });
  });

  // ──────────────────────────────────────────────
  // GET /leads/:id
  // ──────────────────────────────────────────────
  describe('GET /leads/:id', () => {
    it('200 — devuelve el lead encontrado', async () => {
      repo.findById.mockResolvedValue(buildLead());

      const res = await request(app.getHttpServer())
        .get(`/leads/${TEST_UUID}`)
        .expect(200);

      expect(res.body.id).toBe(TEST_UUID);
      expect(res.body.nombre).toBe('Juan Pérez');
    });

    it('404 — lead no encontrado', async () => {
      repo.findById.mockResolvedValue(null);

      await request(app.getHttpServer()).get(`/leads/${TEST_UUID}`).expect(404);
    });

    it('400 — UUID inválido', async () => {
      await request(app.getHttpServer()).get('/leads/no-es-uuid').expect(400);
    });
  });

  // ──────────────────────────────────────────────
  // PATCH /leads/:id
  // ──────────────────────────────────────────────
  describe('PATCH /leads/:id', () => {
    it('200 — actualiza y devuelve el lead', async () => {
      const original = buildLead();
      const updated = buildLead({ nombre: 'Juan Actualizado' });
      repo.findById.mockResolvedValue(original);
      repo.update.mockResolvedValue(updated);

      const res = await request(app.getHttpServer())
        .patch(`/leads/${TEST_UUID}`)
        .send({ nombre: 'Juan Actualizado' })
        .expect(200);

      expect(res.body.nombre).toBe('Juan Actualizado');
    });

    it('200 — actualiza el email cuando no está en uso', async () => {
      const original = buildLead();
      const updated = buildLead({ email: 'nuevo@example.com' });
      repo.findById.mockResolvedValue(original);
      repo.findByEmail.mockResolvedValue(null);
      repo.update.mockResolvedValue(updated);

      await request(app.getHttpServer())
        .patch(`/leads/${TEST_UUID}`)
        .send({ email: 'nuevo@example.com' })
        .expect(200);
    });

    it('404 — lead no encontrado', async () => {
      repo.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch(`/leads/${TEST_UUID}`)
        .send({ nombre: 'Nuevo Nombre' })
        .expect(404);
    });

    it('409 — el nuevo email ya está en uso por otro lead', async () => {
      const original = buildLead();
      const other = buildLead({ id: OTHER_UUID, email: 'otro@example.com' });
      repo.findById.mockResolvedValue(original);
      repo.findByEmail.mockResolvedValue(other);

      await request(app.getHttpServer())
        .patch(`/leads/${TEST_UUID}`)
        .send({ email: 'otro@example.com' })
        .expect(409);
    });

    it('400 — UUID inválido', async () => {
      await request(app.getHttpServer())
        .patch('/leads/no-es-uuid')
        .send({ nombre: 'Test' })
        .expect(400);
    });
  });

  // ──────────────────────────────────────────────
  // DELETE /leads/:id
  // ──────────────────────────────────────────────
  describe('DELETE /leads/:id', () => {
    it('204 — elimina el lead (soft delete)', async () => {
      repo.findById.mockResolvedValue(buildLead());
      repo.softDelete.mockResolvedValue(undefined);

      await request(app.getHttpServer()).delete(`/leads/${TEST_UUID}`).expect(204);

      expect(repo.softDelete).toHaveBeenCalledWith(TEST_UUID, TEST_USER.sub);
    });

    it('404 — lead no encontrado', async () => {
      repo.findById.mockResolvedValue(null);

      await request(app.getHttpServer()).delete(`/leads/${TEST_UUID}`).expect(404);

      expect(repo.softDelete).not.toHaveBeenCalled();
    });

    it('400 — UUID inválido', async () => {
      await request(app.getHttpServer()).delete('/leads/no-es-uuid').expect(400);
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// JwtAuthGuard — comportamiento real (sin override del guard)
// ──────────────────────────────────────────────────────────────────────────────
describe('LeadsController — JwtAuthGuard', () => {
  let authApp: INestApplication;
  let authRepo: jest.Mocked<ILeadRepository>;
  let authAi: jest.Mocked<IAiSummaryProvider>;
  let jwtService: JwtService;

  beforeAll(async () => {
    authRepo = buildRepo();
    authAi = buildAi();

    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: TEST_JWT_SECRET, signOptions: { expiresIn: '1h' } }),
      ],
      controllers: [LeadsController],
      providers: [
        CreateLeadUseCase,
        ListLeadsUseCase,
        GetLeadUseCase,
        UpdateLeadUseCase,
        DeleteLeadUseCase,
        GetLeadStatsUseCase,
        GetLeadAiSummaryUseCase,
        { provide: LEAD_REPOSITORY, useValue: authRepo },
        { provide: AI_SUMMARY_PORT, useValue: authAi },
        TestJwtStrategy,
      ],
    }).compile();

    authApp = moduleRef.createNestApplication();
    authApp.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await authApp.init();
    jwtService = moduleRef.get(JwtService);
  });

  afterAll(() => authApp.close());
  beforeEach(() => jest.resetAllMocks());

  it('401 — sin token en GET /leads', () =>
    request(authApp.getHttpServer()).get('/leads').expect(401));

  it('401 — sin token en POST /leads', () =>
    request(authApp.getHttpServer()).post('/leads').send({}).expect(401));

  it('401 — sin token en DELETE /leads/:id', () =>
    request(authApp.getHttpServer()).delete(`/leads/${TEST_UUID}`).expect(401));

  it('401 — token malformado (no es JWT)', () =>
    request(authApp.getHttpServer())
      .get('/leads')
      .set('Authorization', 'Bearer esto-no-es-un-jwt')
      .expect(401));

  it('401 — token expirado', async () => {
    const expired = jwtService.sign(
      { sub: 'user-id', email: 'test@test.com', tokenVersion: 1, type: 'access' },
      { expiresIn: '0s' },
    );

    await request(authApp.getHttpServer())
      .get('/leads')
      .set('Authorization', `Bearer ${expired}`)
      .expect(401);
  });

  it('200 — token válido permite el acceso', async () => {
    const token = jwtService.sign({
      sub: 'user-test-uuid',
      email: 'admin@test.com',
      tokenVersion: 1,
      type: 'access',
    });
    authRepo.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });

    await request(authApp.getHttpServer())
      .get('/leads')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('200 — user.sub del token se propaga al caso de uso', async () => {
    const token = jwtService.sign({
      sub: 'actor-especifico',
      email: 'actor@test.com',
      tokenVersion: 1,
      type: 'access',
    });
    authRepo.findById.mockResolvedValue(buildLead());
    authRepo.softDelete.mockResolvedValue(undefined);

    await request(authApp.getHttpServer())
      .delete(`/leads/${TEST_UUID}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    expect(authRepo.softDelete).toHaveBeenCalledWith(TEST_UUID, 'actor-especifico');
  });
});
