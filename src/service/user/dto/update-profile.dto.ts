import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Prisma } from '@prisma/client';

export const updateProfileSchema = z.object({
  email: z.email().optional(),
  phone: z.string().min(8).optional(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  avatar: z.string().optional(),
});

export class CUpdateProfileDto extends createZodDto(updateProfileSchema) {}

export type UpdateProfileResponse = Prisma.usersGetPayload<{
  select: {
    id: true;
    email: true;
    phone: true;
    first_name: true;
    last_name: true;
    role: true;
    avatar: true;
    created_at: true;
    updated_at: true;
  };
}>;
