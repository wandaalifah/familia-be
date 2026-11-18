import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { MedicalRecordType, Prisma } from '@prisma/client';
import { globalPaginationQuerySchema } from '../../../common/dto/pagination.dto';
import { dateQuerySchema } from '../../../common/helpers/date-range';

export const listMedicalHistorySchema = globalPaginationQuerySchema.extend({
  sort_by: z
    .enum(['created_at', 'administered_at', 'title', 'type', 'next_due_date'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  search_by: z
    .enum([
      'title',
      'complaint',
      'diagnosis',
      'vaccine_name',
      'doctor_name',
      'medical_staff_name',
    ])
    .optional(),
  search: z.string().optional(),
  petId: z.string().optional(),
  // Pet owner
  userId: z.string().optional(),
  type: z.enum(MedicalRecordType).optional(),
  doctor_name: z.string().optional(),
  medical_staff_name: z.string().optional(),
  // Range on administered_at
  startDate: dateQuerySchema.optional(),
  endDate: dateQuerySchema.optional(),
});

export class CGetMedicalHistoryListDto extends createZodDto(listMedicalHistorySchema) {}

// Same filters as the list, but every matching row is exported (no pagination)
export const exportMedicalHistorySchema = listMedicalHistorySchema.omit({
  page: true,
  limit: true,
});

export class CExportMedicalHistoryDto extends createZodDto(exportMedicalHistorySchema) {}

export const MAX_UPCOMING_DAYS = 30;

export const upcomingDuesSchema = globalPaginationQuerySchema.extend({
  // Look-ahead window in days
  days: z.coerce.number().int().min(1).max(MAX_UPCOMING_DAYS).default(MAX_UPCOMING_DAYS),
  type: z.enum(MedicalRecordType).optional(),
});

export class CGetUpcomingDuesDto extends createZodDto(upcomingDuesSchema) {}

export type MedicalHistoryItem = Prisma.medical_historyGetPayload<{}>;

const medicalHistoryWithPetArgs = Prisma.validator<Prisma.medical_historyDefaultArgs>()({
  include: {
    pet: {
      select: {
        id: true,
        name: true,
        species: true,
        users: {
          select: { id: true, first_name: true, last_name: true, phone: true },
        },
      },
    },
  },
});

export type MedicalHistoryWithPet = Prisma.medical_historyGetPayload<
  typeof medicalHistoryWithPetArgs
>;
