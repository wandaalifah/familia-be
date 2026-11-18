import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PointTransactionType } from '@prisma/client';

export const adjustPointsSchema = z
  .object({
    membershipId: z.string().uuid(),
    // > 0 adds points, < 0 deducts points
    amount: z.number().int().refine((value) => value !== 0, 'Amount must not be 0'),
    type: z
      .enum([PointTransactionType.ADJUSTMENT, PointTransactionType.EARNED])
      .default(PointTransactionType.ADJUSTMENT),
    description: z.string().min(1).optional(),
  })
  .refine((data) => data.type !== PointTransactionType.EARNED || data.amount > 0, {
    message: 'EARNED type requires a positive amount',
    path: ['amount'],
  });

export class CAdjustPointsDto extends createZodDto(adjustPointsSchema) {}
