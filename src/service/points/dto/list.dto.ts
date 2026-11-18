import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PointTransactionType, Prisma } from '@prisma/client';
import { globalPaginationQuerySchema } from '../../../common/dto/pagination.dto';
import { dateQuerySchema } from '../../../common/helpers/date-range';
import { rangeNumberQuerySchema } from '../../../common/helpers/filters';

export const listPointsHistorySchema = globalPaginationQuerySchema.extend({
  sort_by: z
    .enum(['created_at', 'amount', 'type'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  // Without search_by, search matches customer name/phone, reference_id and description
  search_by: z.enum(['description', 'type', 'customer', 'reference_id']).optional(),
  search: z.string().optional(),
  type: z.enum(PointTransactionType).optional(),
  membershipId: z.string().uuid().optional(),
  // Range on the transaction amount (negative amounts are deductions)
  minAmount: rangeNumberQuerySchema,
  maxAmount: rangeNumberQuerySchema,
  startDate: dateQuerySchema.optional(),
  endDate: dateQuerySchema.optional(),
});

export class CGetPointsHistoryListDto extends createZodDto(listPointsHistorySchema) {}

// Same filters as the list, but every matching row is exported (no pagination)
export const exportPointsHistorySchema = listPointsHistorySchema.omit({ page: true, limit: true });

export class CExportPointsHistoryDto extends createZodDto(exportPointsHistorySchema) {}

const pointsHistoryItemArgs = Prisma.validator<Prisma.points_historyDefaultArgs>()({
  include: {
    membership: {
      select: {
        id: true,
        userId: true,
        users: {
          select: {
            id: true,
            email: true,
            phone: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    },
  },
});

export type PointsHistoryItem = Prisma.points_historyGetPayload<typeof pointsHistoryItemArgs>;
