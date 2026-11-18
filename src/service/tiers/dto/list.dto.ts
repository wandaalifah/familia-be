import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Prisma } from '@prisma/client';
import { globalPaginationQuerySchema } from '../../../common/dto/pagination.dto';

export const listTiersSchema = globalPaginationQuerySchema.extend({
  sort_by: z
    .enum(['created_at', 'name', 'level', 'required_points'])
    .default('level'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
  search_by: z.enum(['name', 'description']).optional(),
  search: z.string().optional(),
});

export class CGetTiersListDto extends createZodDto(listTiersSchema) {}

// Same filters as the list, but every matching row is exported (no pagination)
export const exportTiersSchema = listTiersSchema.omit({ page: true, limit: true });

export class CExportTiersDto extends createZodDto(exportTiersSchema) {}

export type TierItem = Prisma.tiersGetPayload<{
  include: { _count: { select: { memberships: true } } };
}>;
