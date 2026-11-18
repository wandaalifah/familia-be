import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Prisma } from '@prisma/client';

export const updateRewardSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  points_cost: z.coerce.number().int().min(1).optional(),
});

export class CUpdateRewardDto extends createZodDto(updateRewardSchema) {}

export type UpdateRewardResponse = Prisma.couponGetPayload<{}>;
