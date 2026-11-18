import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { NotificationCategory, Prisma } from '@prisma/client';
import { globalPaginationQuerySchema } from '../../../common/dto/pagination.dto';
import { dateQuerySchema } from '../../../common/helpers/date-range';

// Query strings arrive as text, so parse 'true' / 'false' explicitly
const booleanQuerySchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

export const listNotificationSchema = globalPaginationQuerySchema.extend({
  sort_by: z.enum(['created_at', 'target_due_date']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  category: z.enum(NotificationCategory).optional(),
  is_read: booleanQuerySchema.optional(),
  petId: z.string().optional(),
  userId: z.string().optional(),
  startDate: dateQuerySchema.optional(),
  endDate: dateQuerySchema.optional(),
});

export class CGetNotificationListDto extends createZodDto(listNotificationSchema) {}

// Customers only see their own notifications
export const listUserNotificationSchema = globalPaginationQuerySchema.extend({
  category: z.enum(NotificationCategory).optional(),
  is_read: booleanQuerySchema.optional(),
});

export class CGetUserNotificationListDto extends createZodDto(listUserNotificationSchema) {}

const notificationItemArgs = Prisma.validator<Prisma.notification_historyDefaultArgs>()({
  include: {
    pet: { select: { id: true, name: true, species: true } },
    users: { select: { id: true, first_name: true, last_name: true, phone: true } },
  },
});

export type NotificationItem = Prisma.notification_historyGetPayload<typeof notificationItemArgs>;
