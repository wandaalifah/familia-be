import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Prisma } from '@prisma/client';

export const registerClientSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  phone: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
});

export class CRegisterClientDto extends createZodDto(registerClientSchema) {}

export type RegisterClientResponse = Prisma.usersGetPayload<{
  omit: { password: true; hashed_refresh_token: true };
  include: {
    membership: {
      include: {
        tiers: true;
      };
    };
  };
}>;
