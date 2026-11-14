import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { MedicalRecordType, Prisma } from '@prisma/client';

export const createMedicalHistorySchema = z.object({
  petId: z.string().min(1),
  type: z.enum(MedicalRecordType),
  title: z.string().min(1),
  description: z.string().optional(),
  vaccine_name: z.string().optional(),
  administered_at: z.iso.datetime(),
  next_due_date: z.iso.datetime().optional(),
  discharged_at: z.iso.datetime().optional(),
  notes: z.string().optional(),
  doctor_name: z.string().optional(),
});

export class CCreateMedicalHistoryDto extends createZodDto(createMedicalHistorySchema) {}

export type CreateMedicalHistoryResponse = Prisma.medical_historyGetPayload<{}>;
