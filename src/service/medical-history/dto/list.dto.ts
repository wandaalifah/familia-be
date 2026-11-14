import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { MedicalRecordType, Prisma } from '@prisma/client';
import { globalPaginationQuerySchema } from '../../../common/dto/pagination.dto';

export const listMedicalHistorySchema = globalPaginationQuerySchema.extend({
  sort_by: z
    .enum(['created_at', 'administered_at', 'title', 'type', 'next_due_date'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  search_by: z.enum(['title', 'description', 'vaccine_name', 'doctor_name']).optional(),
  search: z.string().optional(),
  petId: z.string().optional(),
  type: z.enum(MedicalRecordType).optional(),
});

export class CGetMedicalHistoryListDto extends createZodDto(listMedicalHistorySchema) {}

export type MedicalHistoryItem = Prisma.medical_historyGetPayload<{}>;
