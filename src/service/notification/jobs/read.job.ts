import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

export const JGetUnreadCountJob = async (
  prisma: PrismaService,
  userId: string,
): Promise<{ unread: number }> => {
  try {
    const unread = await prisma.notification_history.count({ where: { userId, is_read: false } });
    return { unread };
  } catch (error) {
    console.error('Error in JGetUnreadCountJob:', error);
    throw error;
  }
};

// Scoped by userId so a customer can never mark someone else's notification
export const JMarkNotificationReadJob = async (
  prisma: PrismaService,
  userId: string,
  id: string,
): Promise<{ id: string; is_read: boolean }> => {
  try {
    const { count } = await prisma.notification_history.updateMany({
      where: { id, userId },
      data: { is_read: true, read_at: new Date() },
    });

    if (count === 0) {
      throw new NotFoundException('Notification not found');
    }

    return { id, is_read: true };
  } catch (error) {
    console.error('Error in JMarkNotificationReadJob:', error);
    throw error;
  }
};

export const JMarkAllNotificationsReadJob = async (
  prisma: PrismaService,
  userId: string,
): Promise<{ updated: number }> => {
  try {
    const { count } = await prisma.notification_history.updateMany({
      where: { userId, is_read: false },
      data: { is_read: true, read_at: new Date() },
    });
    return { updated: count };
  } catch (error) {
    console.error('Error in JMarkAllNotificationsReadJob:', error);
    throw error;
  }
};
