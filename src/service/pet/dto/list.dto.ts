import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Prisma } from '@prisma/client';
import { globalPaginationQuerySchema } from '../../../common/dto/pagination.dto';
import { booleanQuerySchema } from '../../../common/helpers/filters';

export const PET_STATUSES = ['ACTIVE', 'ARCHIVED', 'ALL'] as const;
export type PetStatus = (typeof PET_STATUSES)[number];

export const listPetSchema = globalPaginationQuerySchema.extend({
  sort_by: z
    .enum(['created_at', 'name', 'species', 'breed', 'birth_date'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  // 'owner' matches the owner's name or phone number; without search_by every column is searched
  search_by: z.enum(['name', 'species', 'breed', 'owner']).optional(),
  search: z.string().optional(),
  userId: z.string().optional(),
  species: z.string().optional(),
  breed: z.string().optional(),
  is_neutered: booleanQuerySchema.optional(),
  // ACTIVE: not archived (default) | ARCHIVED: soft-deleted only | ALL: both
  status: z.enum(PET_STATUSES).default('ACTIVE'),
});

export class CGetPetListDto extends createZodDto(listPetSchema) {}

// Same filters as the list, but every matching row is exported (no pagination).
// `status` has no default here so `includeDeleted=true` can widen it to ALL.
export const exportPetSchema = listPetSchema.omit({ page: true, limit: true }).extend({
  status: z.enum(PET_STATUSES).optional(),
  includeDeleted: booleanQuerySchema.optional(),
});

export class CExportPetDto extends createZodDto(exportPetSchema) {}

const petListItemArgs = Prisma.validator<Prisma.petDefaultArgs>()({
  include: {
    users: {
      select: { id: true, first_name: true, last_name: true, phone: true },
    },
    _count: { select: { medical_history: true } },
  },
});

export type PetListItem = Prisma.petGetPayload<typeof petListItemArgs>;

const petDetailArgs = Prisma.validator<Prisma.petDefaultArgs>()({
  include: {
    users: {
      select: { id: true, first_name: true, last_name: true, phone: true, email: true },
    },
    medical_history: { orderBy: { administered_at: 'desc' } },
  },
});

export type PetDetail = Prisma.petGetPayload<typeof petDetailArgs>;

export type PetItem = Prisma.petGetPayload<{}>;
