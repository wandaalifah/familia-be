import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Prisma } from '@prisma/client';

export const createRewardSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  points_cost: z.coerce.number().int().min(0),
});

export class CCreateRewardDto extends createZodDto(createRewardSchema) {}

export type CreateRewardResponse = Prisma.couponGetPayload<{}>;
