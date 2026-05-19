import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadOrmEntity } from './infrastructure/persistence/lead.orm-entity';
import { LeadTypeormRepository } from './infrastructure/persistence/lead.typeorm-repository';
import { LeadsController } from './infrastructure/http/leads.controller';
import { CreateLeadUseCase } from './application/use-cases/create-lead.use-case';
import { ListLeadsUseCase } from './application/use-cases/list-leads.use-case';
import { GetLeadUseCase } from './application/use-cases/get-lead.use-case';
import { UpdateLeadUseCase } from './application/use-cases/update-lead.use-case';
import { DeleteLeadUseCase } from './application/use-cases/delete-lead.use-case';
import { GetLeadStatsUseCase } from './application/use-cases/get-lead-stats.use-case';
import { LEAD_REPOSITORY } from './domain/lead.repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([LeadOrmEntity])],
  controllers: [LeadsController],
  providers: [
    { provide: LEAD_REPOSITORY, useClass: LeadTypeormRepository },
    CreateLeadUseCase,
    ListLeadsUseCase,
    GetLeadUseCase,
    UpdateLeadUseCase,
    DeleteLeadUseCase,
    GetLeadStatsUseCase,
  ],
})
export class LeadsModule {}
