import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Prisma } from '@prisma/client';
import { globalPaginationQuerySchema } from '../../../common/dto/pagination.dto';

export const listRewardSchema = globalPaginationQuerySchema.extend({
  sort_by: z
    .enum(['created_at', 'title', 'points_cost'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  search_by: z.enum(['title', 'description']).optional(),
  search: z.string().optional(),
});

export class CGetRewardListDto extends createZodDto(listRewardSchema) {}

export type RewardItem = Prisma.couponGetPayload<{}>;
