import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Prisma } from '@prisma/client';

export const updatePetSchema = z.object({
  name: z.string().min(1).optional(),
  species: z.string().optional(),
  breed: z.string().optional(),
  birth_date: z.iso.datetime().optional(),
  is_neutered: z.boolean().optional(),
  avatar: z.string().optional(),
});

export class CUpdatePetDto extends createZodDto(updatePetSchema) {}

export type UpdatePetResponse = Prisma.petGetPayload<{}>;
