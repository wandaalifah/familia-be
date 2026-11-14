import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Prisma } from '@prisma/client';
import { passwordSchema } from '../../../common/dto/password.dto';

export const createMembershipSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().optional(),
  // Optional initial password (falls back to default 'secret123' when empty)
  password: passwordSchema.or(z.literal('')).optional(),
});

export class CCreateMembershipDto extends createZodDto(createMembershipSchema) {}

export type CreateMembershipResponse = Prisma.membershipGetPayload<{
  include: {
    users: {
      select: {
        id: true;
        email: true;
        phone: true;
        first_name: true;
        last_name: true;
        role: true;
      };
    };
    tiers: {
      select: {
        id: true;
        name: true;
        required_points: true;
      };
    };
  };
}>
