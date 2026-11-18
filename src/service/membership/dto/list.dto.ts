import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Prisma } from '@prisma/client';
import { globalPaginationQuerySchema } from '../../../common/dto/pagination.dto';
import { dateQuerySchema } from '../../../common/helpers/date-range';
import { rangeNumberQuerySchema } from '../../../common/helpers/filters';

export const listMembershipSchema = globalPaginationQuerySchema.extend({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  sort_by: z
    .enum(['created_at', 'points', 'seasonal_points', 'first_name', 'email'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  // Without search_by, search matches name, email and phone
  search_by: z.enum(['name', 'email', 'phone']).optional(),
  search: z.string().optional(),
  tier_id: z.string().uuid().optional(),
  // Range on the current points balance
  minPoints: rangeNumberQuerySchema,
  maxPoints: rangeNumberQuerySchema,
  // Range on the membership join date (created_at)
  startDate: dateQuerySchema.optional(),
  endDate: dateQuerySchema.optional(),
});

export class CGetMembershipListDto extends createZodDto(listMembershipSchema) {}

// Same filters as the list, but every matching row is exported (no pagination)
export const exportMembershipSchema = listMembershipSchema.omit({ page: true, limit: true });

export class CExportMembershipDto extends createZodDto(exportMembershipSchema) {}

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
