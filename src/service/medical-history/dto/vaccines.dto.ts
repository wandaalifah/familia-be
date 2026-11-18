import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const getVaccinesSchema = z.object({
  petId: z.string().optional(),
  // Free text species, e.g. "Anjing", "Kucing"
  species: z.string().optional(),
});

export class CGetVaccinesDto extends createZodDto(getVaccinesSchema) {}
