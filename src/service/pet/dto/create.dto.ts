import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Prisma } from '@prisma/client';

export const createPetSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  species: z.string().optional(),
  breed: z.string().optional(),
  birth_date: z.iso.datetime().optional(),
  is_neutered: z.boolean().optional(),
  avatar: z.string().optional(),
});

export class CCreatePetDto extends createZodDto(createPetSchema) {}

export type CreatePetResponse = Prisma.petGetPayload<{}>;
