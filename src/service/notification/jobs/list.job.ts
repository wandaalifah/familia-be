import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { IGlobalPaginationDto } from '../../../common/dto/pagination.dto';
import { buildPagination } from '../../../common/helpers/pagination';
import { buildDateRange } from '../../../common/helpers/date-range';
import {
  CGetNotificationListDto,
  CGetUserNotificationListDto,
  NotificationItem,
} from '../dto/list.dto';

const NOTIFICATION_INCLUDE = {
  pet: { select: { id: true, name: true, species: true } },
  users: { select: { id: true, first_name: true, last_name: true, phone: true } },
} satisfies Prisma.notification_historyInclude;

type ListResult = { data: NotificationItem[]; pagination: IGlobalPaginationDto };

export const JGetNotificationListJob = async (
  prisma: PrismaService,
  query: CGetNotificationListDto,
): Promise<ListResult> => {
  try {
    const { page, limit, sort_by, sort_order, category, is_read, petId, userId, startDate, endDate } =
      query;
    const createdAtRange = buildDateRange(startDate, endDate);

    const where: Prisma.notification_historyWhereInput = {
      ...(category ? { category } : {}),
      ...(is_read !== undefined ? { is_read } : {}),
      ...(petId ? { petId } : {}),
      ...(userId ? { userId } : {}),
      ...(createdAtRange ? { created_at: createdAtRange } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.notification_history.findMany({
        where,
        orderBy: { [sort_by]: sort_order },
        skip: (page - 1) * limit,
        take: limit,
        include: NOTIFICATION_INCLUDE,
      }),
      prisma.notification_history.count({ where }),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  } catch (error) {
    console.error('Error in JGetNotificationListJob:', error);
    throw error;
  }
};

export const JGetUserNotificationListJob = async (
  prisma: PrismaService,
  userId: string,
  query: CGetUserNotificationListDto,
): Promise<ListResult> => {
  try {
    const { page, limit, category, is_read } = query;

    const where: Prisma.notification_historyWhereInput = {
      userId,
      ...(category ? { category } : {}),
      ...(is_read !== undefined ? { is_read } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.notification_history.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: NOTIFICATION_INCLUDE,
      }),
      prisma.notification_history.count({ where }),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  } catch (error) {
    console.error('Error in JGetUserNotificationListJob:', error);
    throw error;
  }
};
