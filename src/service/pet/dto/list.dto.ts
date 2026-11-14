import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Prisma } from '@prisma/client';
import { globalPaginationQuerySchema } from '../../../common/dto/pagination.dto';

export const listPetSchema = globalPaginationQuerySchema.extend({
  sort_by: z
    .enum(['created_at', 'name', 'species', 'breed', 'birth_date'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  search_by: z.enum(['name', 'species', 'breed']).optional(),
  search: z.string().optional(),
  userId: z.string().optional(),
  species: z.string().optional(),
  breed: z.string().optional(),
});

export class CGetPetListDto extends createZodDto(listPetSchema) {}

export type PetItem = Prisma.petGetPayload<{}>;
