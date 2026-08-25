import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Prisma } from '@prisma/client';

export const createMembershipSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().optional(),
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
