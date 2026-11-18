import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/prisma/prisma.service";
import { CGetNotificationListDto, CGetUserNotificationListDto } from "./dto/list.dto";
import { JGetNotificationListJob, JGetUserNotificationListJob } from "./jobs/list.job";
import {
  JGetUnreadCountJob,
  JMarkAllNotificationsReadJob,
  JMarkNotificationReadJob,
} from "./jobs/read.job";
import { JRunRemindersJob } from "./jobs/run-reminders.job";

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  getNotificationList = (
    query: CGetNotificationListDto,
  ) => JGetNotificationListJob(this.prisma, query);

  getUserNotificationList = (
    userId: string,
    query: CGetUserNotificationListDto,
  ) => JGetUserNotificationListJob(this.prisma, userId, query);

  getUnreadCount = (
    userId: string,
  ) => JGetUnreadCountJob(this.prisma, userId);

  markRead = (
    userId: string,
    id: string,
  ) => JMarkNotificationReadJob(this.prisma, userId, id);

  markAllRead = (
    userId: string,
  ) => JMarkAllNotificationsReadJob(this.prisma, userId);

  runReminders = (now?: Date) => JRunRemindersJob(this.prisma, now);
}
