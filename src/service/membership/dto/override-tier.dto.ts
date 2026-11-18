import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const overrideTierSchema = z.object({
  tierId: z.string().uuid(),
});

export class COverrideTierDto extends createZodDto(overrideTierSchema) {}
