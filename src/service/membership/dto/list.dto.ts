import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Prisma } from '@prisma/client';
import { globalPaginationQuerySchema } from '../../../common/dto/pagination.dto';

export const listMembershipSchema = globalPaginationQuerySchema.extend({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  sort_by: z
    .enum(['created_at', 'points', 'seasonal_points', 'first_name', 'email'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  search_by: z.enum(['name', 'email', 'phone']).optional(),
  search: z.string().optional(),
  tier_id: z.coerce.number().int().optional(),
});

export class CGetMembershipListDto extends createZodDto(listMembershipSchema) {}

const membershipItemArgs = Prisma.validator<Prisma.membershipDefaultArgs>()({
  include: {
    users: {
      select: {
        id: true,
        email: true,
        phone: true,
        first_name: true,
        last_name: true,
        role: true,
      },
    },
    tiers: {
      select: {
        id: true,
        name: true,
        required_points: true,
      },
    },
  },
});

export type MembershipItem = Prisma.membershipGetPayload<typeof membershipItemArgs>;