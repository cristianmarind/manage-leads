# OneMillion API

API REST para gestión de leads comerciales, construida con **NestJS v11**, **TypeORM** y **PostgreSQL**. Diseñada desde cero con arquitectura hexagonal, autenticación JWT robusta y cobertura de tests completa, se puede probar en un ambiente de pruebas desplegado en Render desde https://manage-leads-zw0e.onrender.com/ tener en cuenta que el aplicativo puede estar apagado al momento de la prueba, entonces hacer alguna peticion y cuando se active probar desde https://manage-leads-zw0e.onrender.com/api/docs/

---

## Tabla de contenidos

- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura hexagonal](#arquitectura-hexagonal)
- [Modelo de datos](#modelo-de-datos)
- [Autenticación — guards y decorators](#autenticación--guards-y-decorators)
- [Logger con patrón Strategy](#logger-con-patrón-strategy)
- [Integración con IA (OpenAI)](#integración-con-ia-openai)
- [Webhook Typeform](#webhook-typeform)
- [Endpoints](#endpoints)
- [Tests](#tests)
- [Configuración y puesta en marcha](#configuración-y-puesta-en-marcha)

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | NestJS v11 |
| Base de datos | PostgreSQL 15+ |
| ORM | TypeORM 1.x |
| Autenticación | JWT (access + refresh) · Passport.js |
| Validación | class-validator · class-transformer |
| IA | OpenAI SDK · gpt-4o-mini |
| Documentación | Swagger / OpenAPI 3 |
| Tests | Jest 30 · Supertest |
| Lenguaje | TypeScript 5 (strict, isolatedModules) |

---

## Arquitectura hexagonal

El módulo `leads` implementa **Ports & Adapters** de forma estricta. El dominio no conoce a NestJS, TypeORM ni OpenAI; solo habla en términos de sus propias interfaces.

```
src/leads/
├── domain/                        ← Núcleo: sin dependencias de framework
│   ├── lead.ts                    Entity de dominio (clase pura)
│   ├── fuente.enum.ts             Enum de valores permitidos
│   ├── lead.repository.port.ts   Puerto ILeadRepository + tipos de filtro
│   ├── ai-summary.port.ts        Puerto IAiSummaryProvider
│   └── lead-logger.port.ts       Puerto ILeadLogger
│
├── application/                   ← Casos de uso: orquestan dominio y puertos
│   ├── dtos/                      Objetos de transferencia validados
│   └── use-cases/
│       ├── create-lead.use-case.ts
│       ├── list-leads.use-case.ts
│       ├── get-lead.use-case.ts
│       ├── update-lead.use-case.ts
│       ├── delete-lead.use-case.ts
│       ├── get-lead-stats.use-case.ts
│       └── get-lead-ai-summary.use-case.ts
│
└── infrastructure/                ← Adaptadores: implementan los puertos
    ├── persistence/
    │   ├── lead.orm-entity.ts     Entidad TypeORM (adaptador de BD)
    │   └── lead.typeorm-repository.ts  Implementa ILeadRepository
    ├── ai/
    │   └── openai-summary.adapter.ts  Implementa IAiSummaryProvider
    ├── logger/
    │   └── console-lead-logger.ts     Implementa ILeadLogger
    └── http/
        ├── leads.controller.ts        Controlador REST principal
        └── typeform/
            ├── typeform-webhook.controller.ts
            ├── typeform-webhook.mapper.ts
            └── typeform-webhook.dto.ts
```

### Por qué este diseño es superior

**Testabilidad total.** Los casos de uso no dependen de TypeORM ni de NestJS, por lo que se pueden probar instanciándolos directamente con mocks en memoria, sin arrancar el framework ni conectar a BD.

**Intercambiabilidad de adaptadores.** Cambiar PostgreSQL por MongoDB, o `gpt-4o-mini` por Gemini, requiere solo implementar la interfaz correspondiente y registrarla en el módulo; el resto del código no cambia.

**Inyección de dependencias con `Symbol`.** Los tokens `LEAD_REPOSITORY`, `AI_SUMMARY_PORT` y `LEAD_LOGGER` son `Symbol`, lo que garantiza que el dominio no importa nunca clases de infraestructura.

```typescript
// domain/lead.repository.port.ts — solo una interfaz + un Symbol
export const LEAD_REPOSITORY = Symbol('LEAD_REPOSITORY');

export interface ILeadRepository {
  save(lead: Lead): Promise<Lead>;
  findById(id: string): Promise<Lead | null>;
  findByEmail(email: string, includeDeleted?: boolean): Promise<Lead | null>;
  findAll(filter: ListLeadsFilter): Promise<PaginatedResult<Lead>>;
  findAllByFilter(filter: SummaryFilter): Promise<Lead[]>;
  update(lead: Lead): Promise<Lead>;
  softDelete(id: string, deleterId?: string | null): Promise<void>;
  getStats(): Promise<LeadStats>;
}
```

```typescript
// leads.module.ts — el adaptador se registra aquí, lejos del dominio
{ provide: LEAD_REPOSITORY, useClass: LeadTypeormRepository }
```

---

## Modelo de datos

### Tabla `lead`

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` | Identificador único |
| `nombre` | `varchar` | NOT NULL | Nombre del prospecto |
| `email` | `varchar` | NOT NULL, UNIQUE | Email de contacto |
| `telefono` | `varchar` | nullable | Teléfono opcional |
| `fuente` | `enum` | NOT NULL | Canal de captación |
| `producto_interes` | `varchar` | nullable | Producto de interés |
| `presupuesto` | `numeric(10,2)` | nullable | Presupuesto en USD |
| `creator_id` | `uuid` | nullable, FK lógico | Usuario que creó el lead |
| `updater_id` | `uuid` | nullable, FK lógico | Último usuario que lo editó |
| `deleter_id` | `uuid` | nullable, FK lógico | Usuario que lo eliminó |
| `created_at` | `timestamptz` | auto | Fecha de creación |
| `updated_at` | `timestamptz` | auto | Fecha de última modificación |
| `deleted_at` | `timestamptz` | nullable | Soft delete — `null` = activo |

**Enum `fuente`:** `instagram` · `facebook` · `landing_page` · `referido` · `otro`

> Los campos `creator_id`, `updater_id`, `deleter_id` se populan automáticamente desde el JWT del usuario autenticado, creando una auditoría completa sin depender de triggers de BD.

### Tabla `users`

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `uuid` | PK | Identificador único |
| `full_name` | `varchar(160)` | NOT NULL | Nombre completo |
| `email` | `varchar(190)` | NOT NULL, UNIQUE | Email de acceso |
| `password_hash` | `varchar(255)` | NOT NULL | Hash bcrypt |
| `is_active` | `boolean` | default `true` | Habilita/deshabilita el acceso |
| `last_login_at` | `timestamptz` | nullable | Último acceso registrado |
| `refresh_token_hash` | `varchar(255)` | nullable | Hash del refresh token activo |
| `refresh_token_expires_at` | `timestamptz` | nullable | Expiración del refresh token |
| `token_version` | `int` | default `0` | Versión para invalidación masiva |
| `created_at` | `timestamptz` | auto | — |
| `updated_at` | `timestamptz` | auto | — |
| `deleted_at` | `timestamptz` | nullable | Soft delete |

---

## Autenticación — guards y decorators

### Flujo JWT de doble token

```
POST /auth/login
  → access_token  (corta duración, tipo "access")
  → refresh_token (larga duración, tipo "refresh", hash guardado en BD)

POST /auth/refresh  (requiere access token válido en header)
  → nuevo access_token + refresh_token

POST /auth/logout         → limpia refresh_token en BD
POST /auth/logout-all     → incrementa token_version (invalida todos los tokens emitidos)
GET  /auth/me             → datos del usuario autenticado
```

### Mecanismo de seguridad adicional

Cada token incluye `tokenVersion` (número de versión del usuario). Al verificar, `JwtStrategy` consulta la BD y compara: si el usuario corrió `logout-all`, la versión aumentó y todos los tokens anteriores quedan inválidos automáticamente, incluso si aún no han expirado.

```typescript
// auth/strategies/jwt.strategy.ts
async validate(payload: JwtPayload): Promise<JwtPayload> {
  if (payload.type === 'refresh') throw new UnauthorizedException('Invalid token type');

  const user = await this.usersRepository.findOne({ where: { id: payload.sub, isActive: true } });
  if (!user) throw new UnauthorizedException('User not found or inactive');

  if (payload.tokenVersion !== user.tokenVersion)
    throw new UnauthorizedException('Token version mismatch');  // logout-all activado

  return payload;
}
```

Los refresh tokens también se almacenan **hasheados con bcrypt**, de modo que un acceso no autorizado a la BD no permite reutilizarlos.

### `JwtAuthGuard`

Guard minimalista que extiende el guard de Passport; toda la lógica de validación vive en la estrategia.

```typescript
// auth/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

Se aplica a nivel de clase en los controladores protegidos:

```typescript
@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController { ... }
```

### `@CurrentUser()` decorator

Decorator de parámetro que extrae el payload del JWT del request, ya verificado por Passport, y lo tipifica como `JwtPayload`.

```typescript
// auth/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (_data, ctx: ExecutionContext): JwtPayload => ctx.switchToHttp().getRequest().user,
);
```

Uso en cualquier controlador protegido:

```typescript
@Delete(':id')
remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
  return this.deleteLeadUseCase.execute(id, user.sub);
  //                                          ↑ actor_id para auditoría
}
```

---

## Logger con patrón Strategy

El dominio define el **puerto** `ILeadLogger`; la infraestructura provee la **estrategia** concreta. Hoy es `ConsoleLeadLogger`, mañana puede ser un adaptador de Datadog, Winston o cualquier otro sistema sin tocar los casos de uso.

```
ILeadLogger (domain port)
    └── ConsoleLeadLogger  ← estrategia actual (stdout JSON estructurado)
    └── (futura) DatadogLeadLogger
    └── (futura) WinstonLeadLogger
```

```typescript
// domain/lead-logger.port.ts
export const LEAD_LOGGER = Symbol('LEAD_LOGGER');

export interface ILeadLogger {
  log(action: string, context: Record<string, unknown>): void;
}
```

```typescript
// infrastructure/logger/console-lead-logger.ts
@Injectable()
export class ConsoleLeadLogger implements ILeadLogger {
  log(action: string, context: Record<string, unknown>): void {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), action, ...context }));
  }
}
```

El logger es **opcional** en los casos de uso (`@Optional()`), lo que permite omitirlo completamente en los tests de integración sin romper el grafo de dependencias:

```typescript
@Injectable()
export class CreateLeadUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY) private readonly leads: ILeadRepository,
    @Optional() @Inject(LEAD_LOGGER) private readonly logger: ILeadLogger | null = null,
  ) {}
}
```

Cada caso de uso emite eventos con acción y contexto semánticos:

```json
{ "timestamp": "2026-05-19T12:00:00.000Z", "action": "lead.created",
  "lead_id": "f47ac10b-...", "fuente": "instagram", "actor_id": "user-uuid" }
```

---

## Integración con IA (OpenAI)

`POST /leads/ai/summary` genera un resumen ejecutivo en lenguaje natural a partir de los leads filtrados.

```
Flujo:
1. Controlador recibe filtros opcionales (fuente, rango de fechas)
2. GetLeadAiSummaryUseCase consulta ILeadRepository.findAllByFilter()
3. Si no hay leads → responde sin llamar a la IA
4. OpenAiSummaryAdapter envía los datos a gpt-4o-mini
5. Retorna { summary: string, leads_analyzed: number }
```

El adaptador serializa solo los campos relevantes (fuente, presupuesto, producto, fecha) para minimizar tokens y construye un prompt de sistema que pide: análisis general, fuente principal, análisis de presupuesto y recomendaciones accionables.

```typescript
// infrastructure/ai/openai-summary.adapter.ts
export class OpenAiSummaryAdapter implements IAiSummaryProvider {
  async generateLeadSummary(leads: Lead[]): Promise<string> {
    // Serializa solo campos necesarios, llama a gpt-4o-mini con temperature 0.3
  }
}
```

---

## Webhook Typeform

`POST /leads/webhook` actúa como **adaptador de entrada** para integraciones con Typeform, siguiendo el mismo patrón hexagonal:

```
Typeform payload → TypeformWebhookMapper → CreateLeadDto → CreateLeadUseCase
```

`TypeformWebhookMapper` extrae los campos de `answers[]` usando `field.ref` como clave de búsqueda, creando un `CreateLeadDto` estándar que pasa por la misma validación (`class-validator`) y la misma lógica de negocio que el endpoint REST principal. Sin duplicación de reglas.

| `field.ref` | Campo en DTO |
|---|---|
| `nombre` | `nombre` |
| `email` | `email` |
| `telefono` | `telefono` |
| `fuente` | `fuente` (debe ser valor del enum) |
| `producto_interes` | `producto_interes` |
| `presupuesto` | `presupuesto` |

---

## Endpoints

### Auth — `POST /auth/...`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/login` | — | Login, devuelve access + refresh token |
| POST | `/auth/refresh` | Bearer | Rota los tokens |
| POST | `/auth/logout` | Bearer | Invalida el refresh token activo |
| POST | `/auth/logout-all` | Bearer | Invalida todos los tokens (incrementa tokenVersion) |
| GET | `/auth/me` | Bearer | Perfil del usuario autenticado |

### Users — `[auth required]`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/users` | Crear usuario |
| GET | `/users` | Listar usuarios (paginado) |
| GET | `/users/me` | Perfil propio |
| GET | `/users/:id` | Buscar usuario |
| PATCH | `/users/:id` | Actualizar usuario |
| POST | `/users/:id/activate` | Activar / desactivar usuario |
| DELETE | `/users/:id` | Soft delete |

### Leads — `[auth required]`

| Método | Ruta | Código | Descripción |
|---|---|---|---|
| POST | `/leads` | 201 | Crear lead (validación completa) |
| GET | `/leads` | 200 | Listar leads con paginación y filtros |
| GET | `/leads/stats` | 200 | Estadísticas: total, por fuente, promedio, últimos 7 días |
| POST | `/leads/ai/summary` | 200 | Resumen ejecutivo con IA (filtros opcionales) |
| GET | `/leads/:id` | 200 | Lead por UUID |
| PATCH | `/leads/:id` | 200 | Actualización parcial |
| DELETE | `/leads/:id` | 204 | Soft delete |
| POST | `/leads/webhook` | 201 | Entrada desde Typeform |

**Filtros disponibles en `GET /leads`:**

| Query param | Tipo | Descripción |
|---|---|---|
| `page` | `number` | Página (default 1) |
| `limit` | `number` | Ítems por página (default 20) |
| `fuente` | `Fuente` | Filtrar por canal |
| `date_from` | `ISO 8601` | Leads creados desde esta fecha |
| `date_to` | `ISO 8601` | Leads creados hasta esta fecha |

**Documentación interactiva:** `GET /api/docs` (Swagger UI con botón Authorize para el token JWT).

---

## Tests

### Cobertura

```
src/leads/application/use-cases/     ← 24 tests unitarios de casos de uso
src/leads/infrastructure/http/        ← 34 tests de integración del controlador
```

### Tests unitarios (capa de aplicación)

Prueban cada caso de uso en aislamiento total: instanciación directa, sin NestJS, con repositorios mockeados mediante `jest.fn()`.

```bash
npm run test
```

### Tests de integración (capa HTTP)

Dos bloques diferenciados:

**1. Lógica de negocio** — El `JwtAuthGuard` se reemplaza por un mock que inyecta un usuario de prueba. Se verifica el comportamiento completo de la capa HTTP: validaciones de DTOs, códigos de respuesta, propagación del `user.sub` a los casos de uso.

**2. Comportamiento del guard real** — Se monta el módulo con `PassportModule` y un `TestJwtStrategy` que valida la firma JWT sin consultar la BD. Se prueban: ausencia de token (401), token malformado (401), token expirado (401), token válido (200) y propagación del `sub` al caso de uso.

```bash
npm run test -- --testPathPatterns="leads.controller.spec"
```

---

## Configuración y puesta en marcha

### Variables de entorno

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=onemillion

# JWT
JWT_SECRET=tu-clave-secreta-de-acceso
JWT_REFRESH_SECRET=tu-clave-secreta-de-refresh
JWT_REFRESH_TTL_DAYS=7

# OpenAI
OPENAI_API_KEY=sk-...

# Aplicación
PORT=3000
```

### Arranque

```bash
# Instalar dependencias
npm install

# Ejecutar migraciones
npm run migration:run

# Desarrollo con hot reload
npm run start:dev

# Producción
npm run build && npm run start:prod
```

### Migraciones disponibles

| Migración | Descripción |
|---|---|
| `20260519000000` | Crea tabla `lead` con enum `fuente` |
| `20260519000001` | Seed de leads de ejemplo |
| `20260519000002` | Crea tabla `users` |
| `20260519000003` | Añade campos de auditoría a `lead` (`creator_id`, `updater_id`, `deleter_id`) |
| `20260519000004` | Seed de usuario de prueba |

```bash
# Crear nueva migración
npm run migration:generate -- src/database/migrations/NombreMigracion

# Revertir última migración
npm run migration:revert
```
