import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Prisma } from '@prisma/client';

export const updateTierSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  level: z.coerce.number().int().min(0).optional(),
  required_points: z.coerce.number().int().min(0).optional(),
});

export class CUpdateTierDto extends createZodDto(updateTierSchema) {}

export type UpdateTierResponse = Prisma.tiersGetPayload<{}>;
