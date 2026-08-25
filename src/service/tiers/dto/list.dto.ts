import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Prisma } from '@prisma/client';
import { globalPaginationQuerySchema } from '../../../common/dto/pagination.dto';

export const listTiersSchema = globalPaginationQuerySchema.extend({
  sort_by: z
    .enum(['created_at', 'name', 'level', 'required_points'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  search_by: z.enum(['name', 'description']).optional(),
  search: z.string().optional(),
});

export class CGetTiersListDto extends createZodDto(listTiersSchema) {}

export type TierItem = Prisma.tiersGetPayload<{}>;
