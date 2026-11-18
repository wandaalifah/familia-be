import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Prisma } from '@prisma/client';
import { globalPaginationQuerySchema } from '../../../common/dto/pagination.dto';
import { rangeNumberQuerySchema } from '../../../common/helpers/filters';

export const listRewardSchema = globalPaginationQuerySchema.extend({
  sort_by: z
    .enum(['created_at', 'title', 'points_cost'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  // Without search_by, search matches title and description
  search_by: z.enum(['title', 'description']).optional(),
  search: z.string().optional(),
  // Range on the coupon price in points
  minCost: rangeNumberQuerySchema,
  maxCost: rangeNumberQuerySchema,
});

export class CGetRewardListDto extends createZodDto(listRewardSchema) {}

// Same filters as the list, but every matching row is exported (no pagination)
export const exportRewardSchema = listRewardSchema.omit({ page: true, limit: true });

export class CExportRewardDto extends createZodDto(exportRewardSchema) {}

export type RewardItem = Prisma.couponGetPayload<{
  include: { _count: { select: { redemptions: true } } };
}>;
