import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { MedicalRecordType, Prisma } from '@prisma/client';

export const updateMedicalHistorySchema = z.object({
  petId: z.string().min(1).optional(),
  type: z.enum(MedicalRecordType).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  vaccine_name: z.string().optional(),
  administered_at: z.iso.datetime().optional(),
  next_due_date: z.iso.datetime().optional(),
  discharged_at: z.iso.datetime().optional(),
  notes: z.string().optional(),
  doctor_name: z.string().optional(),
});

export class CUpdateMedicalHistoryDto extends createZodDto(updateMedicalHistorySchema) {}

export type UpdateMedicalHistoryResponse = Prisma.medical_historyGetPayload<{}>;
