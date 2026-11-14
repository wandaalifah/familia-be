import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PointTransactionType, Prisma } from '@prisma/client';
import { globalPaginationQuerySchema } from '../../../common/dto/pagination.dto';

export const getUserPointsHistorySchema = globalPaginationQuerySchema.extend({
  // Default 5 items per page for the user-facing endpoint
  limit: z.coerce.number().int().min(1).max(100).default(5),
  sort_by: z.enum(['created_at', 'amount', 'type']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  type: z.nativeEnum(PointTransactionType).optional(),
});

export class CGetUserPointsHistoryDto extends createZodDto(getUserPointsHistorySchema) {}

export type UserPointsHistoryItem = Prisma.points_historyGetPayload<{}>;
