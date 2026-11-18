import { Module } from "@nestjs/common";
import { AdminNotificationController, UserNotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";
import { ReminderScheduler } from "./reminder.scheduler";

@Module({
  controllers: [AdminNotificationController, UserNotificationController],
  providers: [NotificationService, ReminderScheduler],
})
export class NotificationModule {}
