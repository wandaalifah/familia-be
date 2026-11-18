import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationService } from './notification.service';
import { REMINDER_TIME_ZONE } from './reminder-rules';

// Every day at 08:00 (seconds minutes hours day-of-month month day-of-week)
const DAILY_REMINDER_CRON = '0 0 8 * * *';

@Injectable()
export class ReminderScheduler {
  private readonly logger = new Logger(ReminderScheduler.name);

  constructor(private readonly notificationService: NotificationService) {}

  @Cron(DAILY_REMINDER_CRON, { name: 'daily-reminders', timeZone: REMINDER_TIME_ZONE })
  async handleDailyReminders(): Promise<void> {
    try {
      const result = await this.notificationService.runReminders();
      this.logger.log(`Reminders: ${result.created} created (${result.planned} planned)`);
    } catch (error) {
      this.logger.error('Daily reminders failed', error instanceof Error ? error.stack : error);
    }
  }
}
