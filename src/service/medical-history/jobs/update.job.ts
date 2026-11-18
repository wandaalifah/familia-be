import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MedicalRecordType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CUpdateMedicalHistoryDto, UpdateMedicalHistoryResponse } from '../dto/update.dto';
import { assertVaccineAllowed, deriveNextDueDate, resolveDoseNumber } from '../vaccine-rules';

type ExistingRecord = Prisma.medical_historyGetPayload<{}>;

// Fields that feed the automatic next_due_date calculation
const SCHEDULE_FIELDS = [
  'type',
  'administered_at',
  'dose_number',
  'vaccine_name',
  'petId',
  'next_due_date',
] as const;
// Types whose next_due_date is always derived, never client-provided
const AUTO_DUE_DATE_TYPES: MedicalRecordType[] = [
  MedicalRecordType.VACCINE,
  MedicalRecordType.DEWORMING,
];
// Fields that decide which vaccine catalog applies
const CATALOG_FIELDS = ['vaccine_name', 'petId', 'type'] as const;

const touches = (
  body: CUpdateMedicalHistoryDto,
  fields: readonly (keyof CUpdateMedicalHistoryDto)[],
): boolean => fields.some((field) => body[field] !== undefined);

// Conditional rules are evaluated against the resulting record, not just the patch.
const assertRecordRules = (
  body: CUpdateMedicalHistoryDto,
  existing: ExistingRecord,
  species: string | null,
): void => {
  const type = body.type ?? existing.type;
  const vaccineName = body.vaccine_name ?? existing.vaccine_name;

  if (type === MedicalRecordType.VACCINE && !vaccineName) {
    throw new BadRequestException('vaccine_name is required when type is VACCINE');
  }
  if (body.discharged_at && type !== MedicalRecordType.RAWAT_INAP) {
    throw new BadRequestException('discharged_at is only allowed when type is RAWAT_INAP');
  }
  // Evaluated on the resulting record: either date may come from the patch or the stored row
  const dischargedAt =
    body.discharged_at === undefined ? existing.discharged_at : body.discharged_at;
  const administeredAt = body.administered_at ?? existing.administered_at;
  if (
    type === MedicalRecordType.RAWAT_INAP &&
    dischargedAt &&
    new Date(dischargedAt) < new Date(administeredAt)
  ) {
    throw new BadRequestException('discharged_at must not be earlier than administered_at');
  }
  // Legacy records may hold a vaccine name outside the catalog; only re-validate
  // when the vaccine, the pet (species) or the type is actually being changed.
  if (type === MedicalRecordType.VACCINE && vaccineName && touches(body, CATALOG_FIELDS)) {
    assertVaccineAllowed(vaccineName, species);
  }
};

// Recomputes the dose and the automatic next_due_date from the resulting record.
const resolveSchedule = async (
  prisma: PrismaService,
  id: string,
  body: CUpdateMedicalHistoryDto,
  existing: ExistingRecord,
): Promise<{ doseNumber: number | null; nextDueDate: Date | null | undefined }> => {
  const type = body.type ?? existing.type;
  const vaccineName = body.vaccine_name ?? existing.vaccine_name;

  const doseNumber =
    type === MedicalRecordType.VACCINE && vaccineName
      ? await resolveDoseNumber(prisma, {
          petId: body.petId ?? existing.petId,
          vaccineName,
          excludeId: id,
          requested: body.dose_number ?? existing.dose_number,
        })
      : null;

  if (!touches(body, SCHEDULE_FIELDS)) {
    return { doseNumber, nextDueDate: undefined };
  }

  // A stored auto-derived date must not leak into a type that doesn't derive one
  const inheritedDueDate = AUTO_DUE_DATE_TYPES.includes(existing.type)
    ? null
    : existing.next_due_date;
  const providedDueDate = body.next_due_date ? new Date(body.next_due_date) : inheritedDueDate;
  const nextDueDate = deriveNextDueDate(
    type,
    new Date(body.administered_at ?? existing.administered_at),
    doseNumber,
    providedDueDate,
  );
  return { doseNumber, nextDueDate };
};

export const JUpdateMedicalHistoryJob = async (
  prisma: PrismaService,
  id: string,
  body: CUpdateMedicalHistoryDto,
): Promise<UpdateMedicalHistoryResponse> => {
  try {
    const existing = await prisma.medical_history.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Medical history not found');
    }

    const pet = await prisma.pet.findFirst({
      where: { id: body.petId ?? existing.petId, deleted_at: null },
      select: { species: true },
    });
    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    assertRecordRules(body, existing, pet.species);
    const { doseNumber, nextDueDate } = await resolveSchedule(prisma, id, body, existing);

    const type = body.type ?? existing.type;
    const isVaccine = type === MedicalRecordType.VACCINE;

    return await prisma.medical_history.update({
      where: { id },
      data: {
        ...body,
        vaccine_name: isVaccine ? (body.vaccine_name ?? existing.vaccine_name) : null,
        dose_number: doseNumber,
        ...(nextDueDate === undefined ? {} : { next_due_date: nextDueDate }),
        // Leaving RAWAT_INAP clears any stale discharge date
        ...(type === MedicalRecordType.RAWAT_INAP ? {} : { discharged_at: null }),
      },
    });
  } catch (error) {
    console.error('Error in JUpdateMedicalHistoryJob:', error);
    throw error;
  }
};
