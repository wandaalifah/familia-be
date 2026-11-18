import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Prisma } from '@prisma/client';
import { passwordSchema } from '../../../common/dto/password.dto';

export const registerAdminSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  phone: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
});

export class CRegisterAdminDto extends createZodDto(registerAdminSchema) {}

export type RegisterAdminResponse = Prisma.usersGetPayload<{
  omit: { password: true; hashed_refresh_token: true };
}>;
