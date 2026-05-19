import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { CreateLeadDto } from '../../application/dtos/create-lead.dto';
import { UpdateLeadDto } from '../../application/dtos/update-lead.dto';
import { ListLeadsQueryDto } from '../../application/dtos/list-leads.query.dto';
import { AiSummaryDto } from '../../application/dtos/ai-summary.dto';
import {
  LeadResponseDto,
  PaginatedLeadsResponseDto,
  LeadStatsResponseDto,
  AiSummaryResponseDto,
} from '../../application/dtos/lead-response.dto';
import { CreateLeadUseCase } from '../../application/use-cases/create-lead.use-case';
import { ListLeadsUseCase } from '../../application/use-cases/list-leads.use-case';
import { GetLeadUseCase } from '../../application/use-cases/get-lead.use-case';
import { UpdateLeadUseCase } from '../../application/use-cases/update-lead.use-case';
import { DeleteLeadUseCase } from '../../application/use-cases/delete-lead.use-case';
import { GetLeadStatsUseCase } from '../../application/use-cases/get-lead-stats.use-case';
import { GetLeadAiSummaryUseCase } from '../../application/use-cases/get-lead-ai-summary.use-case';

@ApiTags('leads')
@ApiBearerAuth('access-token')
@Controller('leads')
export class LeadsController {
  constructor(
    private readonly createLeadUseCase: CreateLeadUseCase,
    private readonly listLeadsUseCase: ListLeadsUseCase,
    private readonly getLeadUseCase: GetLeadUseCase,
    private readonly updateLeadUseCase: UpdateLeadUseCase,
    private readonly deleteLeadUseCase: DeleteLeadUseCase,
    private readonly getLeadStatsUseCase: GetLeadStatsUseCase,
    private readonly getLeadAiSummaryUseCase: GetLeadAiSummaryUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo lead' })
  @ApiCreatedResponse({ type: LeadResponseDto, description: 'Lead creado exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos' })
  @ApiConflictResponse({ description: 'Ya existe un lead con ese email' })
  create(@Body() dto: CreateLeadDto) {
    return this.createLeadUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar leads con paginación y filtros' })
  @ApiOkResponse({ type: PaginatedLeadsResponseDto })
  findAll(@Query() query: ListLeadsQueryDto) {
    return this.listLeadsUseCase.execute(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de leads' })
  @ApiOkResponse({ type: LeadStatsResponseDto })
  getStats() {
    return this.getLeadStatsUseCase.execute();
  }

  @Post('ai/summary')
  @ApiOperation({ summary: 'Generar resumen ejecutivo con IA' })
  @ApiOkResponse({ type: AiSummaryResponseDto })
  @ApiBadRequestResponse({ description: 'Filtros inválidos' })
  aiSummary(@Body() dto: AiSummaryDto) {
    return this.getLeadAiSummaryUseCase.execute(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un lead por ID' })
  @ApiOkResponse({ type: LeadResponseDto })
  @ApiNotFoundResponse({ description: 'Lead no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getLeadUseCase.execute(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar campos de un lead' })
  @ApiOkResponse({ type: LeadResponseDto })
  @ApiNotFoundResponse({ description: 'Lead no encontrado' })
  @ApiConflictResponse({ description: 'El nuevo email ya está en uso' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.updateLeadUseCase.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un lead (soft delete)' })
  @ApiNoContentResponse({ description: 'Lead eliminado exitosamente' })
  @ApiNotFoundResponse({ description: 'Lead no encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.deleteLeadUseCase.execute(id);
  }
}
