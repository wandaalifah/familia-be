import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const updateMemberSchema = z
  .object({
    first_name: z.string().trim().min(1).optional(),
    last_name: z.string().trim().optional(),
    email: z.string().email().optional(),
    phone: z.string().min(8).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  });

export class CUpdateMemberDto extends createZodDto(updateMemberSchema) {}
