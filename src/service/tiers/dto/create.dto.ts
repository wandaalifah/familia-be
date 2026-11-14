import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Prisma } from '@prisma/client';

export const createTierSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  level: z.coerce.number().int().min(0),
  required_points: z.coerce.number().int().min(0).default(0),
});

export class CCreateTierDto extends createZodDto(createTierSchema) {}

export type CreateTierResponse = Prisma.tiersGetPayload<{}>;
