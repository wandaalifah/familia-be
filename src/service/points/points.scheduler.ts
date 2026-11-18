import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PointsService } from './points.service';
import { SEASON_TIME_ZONE } from './jobs/reset-seasonal.job';

// 31 December, 23:59:59 (seconds minutes hours day-of-month month day-of-week)
const YEAR_END_CRON = '59 59 23 31 12 *';

@Injectable()
export class PointsScheduler {
  private readonly logger = new Logger(PointsScheduler.name);

  constructor(private readonly pointsService: PointsService) {}

  @Cron(YEAR_END_CRON, { name: 'seasonal-reset', timeZone: SEASON_TIME_ZONE })
  async handleYearEndReset(): Promise<void> {
    try {
      const result = await this.pointsService.resetSeasonal();
      this.logger.log(
        `Seasonal reset ${result.season_year} done: ${result.reset_count} reset, ${result.demoted_count} demoted`,
      );
    } catch (error) {
      this.logger.error('Seasonal reset failed', error instanceof Error ? error.stack : error);
    }
  }
}
