import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadOrmEntity } from './infrastructure/persistence/lead.orm-entity';
import { LeadTypeormRepository } from './infrastructure/persistence/lead.typeorm-repository';
import { ConsoleLeadLogger } from './infrastructure/logger/console-lead-logger';
import { LeadsController } from './infrastructure/http/leads.controller';
import { TypeformWebhookController } from './infrastructure/http/typeform/typeform-webhook.controller';
import { TypeformWebhookMapper } from './infrastructure/http/typeform/typeform-webhook.mapper';
import { CreateLeadUseCase } from './application/use-cases/create-lead.use-case';
import { ListLeadsUseCase } from './application/use-cases/list-leads.use-case';
import { GetLeadUseCase } from './application/use-cases/get-lead.use-case';
import { UpdateLeadUseCase } from './application/use-cases/update-lead.use-case';
import { DeleteLeadUseCase } from './application/use-cases/delete-lead.use-case';
import { GetLeadStatsUseCase } from './application/use-cases/get-lead-stats.use-case';
import { GetLeadAiSummaryUseCase } from './application/use-cases/get-lead-ai-summary.use-case';
import { OpenAiSummaryAdapter } from './infrastructure/ai/openai-summary.adapter';
import { LEAD_REPOSITORY } from './domain/lead.repository.port';
import { LEAD_LOGGER } from './domain/lead-logger.port';
import { AI_SUMMARY_PORT } from './domain/ai-summary.port';

@Module({
  imports: [TypeOrmModule.forFeature([LeadOrmEntity])],
  controllers: [LeadsController, TypeformWebhookController],
  providers: [
    { provide: LEAD_REPOSITORY, useClass: LeadTypeormRepository },
    { provide: LEAD_LOGGER, useClass: ConsoleLeadLogger },
    { provide: AI_SUMMARY_PORT, useClass: OpenAiSummaryAdapter },
    CreateLeadUseCase,
    ListLeadsUseCase,
    GetLeadUseCase,
    UpdateLeadUseCase,
    DeleteLeadUseCase,
    GetLeadStatsUseCase,
    GetLeadAiSummaryUseCase,
    TypeformWebhookMapper,
  ],
})
export class LeadsModule {}
