import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { MedicalRecordType, Prisma } from '@prisma/client';

// Clinical fields shared by create and update (all optional free text / numeric readings)
export const clinicalFieldsShape = {
  // Pemeriksaan utama
  complaint: z.string().trim().min(1),
  clinical_signs: z.string().trim().min(1),
  diagnosis: z.string().trim().min(1),
  // Vital signs & observasi
  weight: z.number().positive().max(500), // kg
  temperature: z.number().min(20).max(50), // °C
  appetite: z.string().trim().min(1),
  defecation: z.string().trim().min(1),
  urination: z.string().trim().min(1),
  vomiting: z.string().trim().min(1),
  // Tindakan, obat & rencana
  treatment: z.string().trim().min(1),
  prescription: z.string().trim().min(1),
  notes: z.string().trim().min(1),
  // Tenaga medis
  doctor_name: z.string().trim().min(1),
  medical_staff_name: z.string().trim().min(1),
};

export const createMedicalHistorySchema = z
  .object({
    petId: z.string().min(1),
    type: z.enum(MedicalRecordType),
    title: z.string().min(1),
    complaint: clinicalFieldsShape.complaint.optional(),
    clinical_signs: clinicalFieldsShape.clinical_signs.optional(),
    diagnosis: clinicalFieldsShape.diagnosis.optional(),
    weight: clinicalFieldsShape.weight.optional(),
    temperature: clinicalFieldsShape.temperature.optional(),
    appetite: clinicalFieldsShape.appetite.optional(),
    defecation: clinicalFieldsShape.defecation.optional(),
    urination: clinicalFieldsShape.urination.optional(),
    vomiting: clinicalFieldsShape.vomiting.optional(),
    treatment: clinicalFieldsShape.treatment.optional(),
    prescription: clinicalFieldsShape.prescription.optional(),
    notes: clinicalFieldsShape.notes.optional(),
    vaccine_name: z.string().min(1).optional(),
    // Vaccine dose (1-based). Defaults to previous doses of the same vaccine + 1
    dose_number: z.number().int().min(1).optional(),
    administered_at: z.iso.datetime(),
    // Ignored for VACCINE and DEWORMING: computed automatically from administered_at
    next_due_date: z.iso.datetime().optional(),
    // Only meaningful for RAWAT_INAP; may be set later when the patient goes home
    discharged_at: z.iso.datetime().optional(),
    doctor_name: clinicalFieldsShape.doctor_name.optional(),
    medical_staff_name: clinicalFieldsShape.medical_staff_name.optional(),
    // Optional loyalty integration: points granted atomically with the record
    award_points: z.number().int().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === MedicalRecordType.VACCINE && !data.vaccine_name) {
      ctx.addIssue({
        code: 'custom',
        path: ['vaccine_name'],
        message: 'vaccine_name is required when type is VACCINE',
      });
    }
    if (data.discharged_at && data.type !== MedicalRecordType.RAWAT_INAP) {
      ctx.addIssue({
        code: 'custom',
        path: ['discharged_at'],
        message: 'discharged_at is only allowed when type is RAWAT_INAP',
      });
    }
    if (data.discharged_at && new Date(data.discharged_at) < new Date(data.administered_at)) {
      ctx.addIssue({
        code: 'custom',
        path: ['discharged_at'],
        message: 'discharged_at must not be earlier than administered_at',
      });
    }
  });

export class CCreateMedicalHistoryDto extends createZodDto(createMedicalHistorySchema) {}

export type CreateMedicalHistoryResponse = Prisma.medical_historyGetPayload<{}>;
