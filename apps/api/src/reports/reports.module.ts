import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { DailySummaryService } from './daily-summary.service';
import { BusinessConfigService } from '../config/config.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [ReportsController],
  providers: [ReportsService, DailySummaryService, BusinessConfigService],
  exports: [DailySummaryService],
})
export class ReportsModule {}
