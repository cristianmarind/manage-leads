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
import { CreateLeadDto } from '../../application/dtos/create-lead.dto';
import { UpdateLeadDto } from '../../application/dtos/update-lead.dto';
import { ListLeadsQueryDto } from '../../application/dtos/list-leads.query.dto';
import { CreateLeadUseCase } from '../../application/use-cases/create-lead.use-case';
import { ListLeadsUseCase } from '../../application/use-cases/list-leads.use-case';
import { GetLeadUseCase } from '../../application/use-cases/get-lead.use-case';
import { UpdateLeadUseCase } from '../../application/use-cases/update-lead.use-case';
import { DeleteLeadUseCase } from '../../application/use-cases/delete-lead.use-case';
import { GetLeadStatsUseCase } from '../../application/use-cases/get-lead-stats.use-case';
import { GetLeadAiSummaryUseCase } from '../../application/use-cases/get-lead-ai-summary.use-case';
import { AiSummaryDto } from '../../application/dtos/ai-summary.dto';

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
  create(@Body() dto: CreateLeadDto) {
    return this.createLeadUseCase.execute(dto);
  }

  @Get()
  findAll(@Query() query: ListLeadsQueryDto) {
    return this.listLeadsUseCase.execute(query);
  }

  @Get('stats')
  getStats() {
    return this.getLeadStatsUseCase.execute();
  }

  @Post('ai/summary')
  aiSummary(@Body() dto: AiSummaryDto) {
    return this.getLeadAiSummaryUseCase.execute(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getLeadUseCase.execute(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.updateLeadUseCase.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.deleteLeadUseCase.execute(id);
  }
}
