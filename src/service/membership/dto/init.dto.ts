import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const initMembershipSchema = z.object({
  userId: z.string().uuid(),
});

export class CInitMembershipDto extends createZodDto(initMembershipSchema) {}
