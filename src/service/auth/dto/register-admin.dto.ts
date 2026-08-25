import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Prisma } from '@prisma/client';

export const registerAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
});

export class CRegisterAdminDto extends createZodDto(registerAdminSchema) {}

export type RegisterAdminResponse = Prisma.usersGetPayload<{}>;
