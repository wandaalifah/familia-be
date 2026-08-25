import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PointTransactionType, Prisma } from '@prisma/client';
import { globalPaginationQuerySchema } from '../../../common/dto/pagination.dto';

export const listPointsHistorySchema = globalPaginationQuerySchema.extend({
  sort_by: z
    .enum(['created_at', 'amount', 'type'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  search_by: z.enum(['description', 'type']).optional(),
  search: z.string().optional(),
  type: z.nativeEnum(PointTransactionType).optional(),
  membershipId: z.string().uuid().optional(),
});

export class CGetPointsHistoryListDto extends createZodDto(listPointsHistorySchema) {}

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
