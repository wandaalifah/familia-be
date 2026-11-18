import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Prisma } from '@prisma/client';
import { globalPaginationQuerySchema } from '../../../common/dto/pagination.dto';
import { dateQuerySchema } from '../../../common/helpers/date-range';

export const redeemRewardSchema = z.object({
  // Customer on whose behalf the admin redeems the coupon
  userId: z.string().uuid(),
});

export class CRedeemRewardDto extends createZodDto(redeemRewardSchema) {}

export const listRedemptionSchema = globalPaginationQuerySchema.extend({
  sort_by: z.enum(['created_at', 'points_spent']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  userId: z.string().uuid().optional(),
  couponId: z.string().uuid().optional(),
  // Matches the customer's name/phone or the coupon title
  search: z.string().optional(),
  // Range on the redemption date (created_at)
  startDate: dateQuerySchema.optional(),
  endDate: dateQuerySchema.optional(),
});

export class CGetRedemptionListDto extends createZodDto(listRedemptionSchema) {}

// Same filters as the list, but every matching row is exported (no pagination)
export const exportRedemptionSchema = listRedemptionSchema.omit({ page: true, limit: true });

export class CExportRedemptionDto extends createZodDto(exportRedemptionSchema) {}

const redemptionItemArgs = Prisma.validator<Prisma.redemption_historyDefaultArgs>()({
  include: {
    users: {
      select: { id: true, email: true, phone: true, first_name: true, last_name: true },
    },
    coupon: { select: { id: true, title: true, points_cost: true } },
  },
});

export type RedemptionItem = Prisma.redemption_historyGetPayload<typeof redemptionItemArgs>;
