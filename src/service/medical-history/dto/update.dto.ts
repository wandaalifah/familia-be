import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { MedicalRecordType, Prisma } from '@prisma/client';
import { clinicalFieldsShape } from './create.dto';

// On update a clinical field can be cleared by sending null
const clearable = <T extends z.ZodType>(schema: T) => schema.nullable().optional();

export const updateMedicalHistorySchema = z.object({
  petId: z.string().min(1).optional(),
  type: z.enum(MedicalRecordType).optional(),
  title: z.string().min(1).optional(),
  complaint: clearable(clinicalFieldsShape.complaint),
  clinical_signs: clearable(clinicalFieldsShape.clinical_signs),
  diagnosis: clearable(clinicalFieldsShape.diagnosis),
  weight: clearable(clinicalFieldsShape.weight),
  temperature: clearable(clinicalFieldsShape.temperature),
  appetite: clearable(clinicalFieldsShape.appetite),
  defecation: clearable(clinicalFieldsShape.defecation),
  urination: clearable(clinicalFieldsShape.urination),
  vomiting: clearable(clinicalFieldsShape.vomiting),
  treatment: clearable(clinicalFieldsShape.treatment),
  prescription: clearable(clinicalFieldsShape.prescription),
  notes: clearable(clinicalFieldsShape.notes),
  vaccine_name: z.string().min(1).optional(),
  dose_number: z.number().int().min(1).optional(),
  administered_at: z.iso.datetime().optional(),
  next_due_date: z.iso.datetime().optional(),
  discharged_at: clearable(z.iso.datetime()),
  doctor_name: clearable(clinicalFieldsShape.doctor_name),
  medical_staff_name: clearable(clinicalFieldsShape.medical_staff_name),
});

export class CUpdateMedicalHistoryDto extends createZodDto(updateMedicalHistorySchema) {}

export type UpdateMedicalHistoryResponse = Prisma.medical_historyGetPayload<{}>;
