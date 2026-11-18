import { BadRequestException } from '@nestjs/common';
import { MedicalRecordType, Prisma } from '@prisma/client';
import {
  getVaccinesForSpecies,
  isVaccineAllowedForSpecies,
} from '../../common/vaccines/vaccine-master';
import {
  calculateDewormingNextDueDate,
  calculateVaccineNextDueDate,
} from '../../common/vaccines/vaccine-schedule';

type Client = Prisma.TransactionClient | Prisma.DefaultPrismaClient;

export const assertVaccineAllowed = (vaccineName: string, species?: string | null): void => {
  if (isVaccineAllowedForSpecies(vaccineName, species)) return;

  const allowed = getVaccinesForSpecies(species).map((vaccine) => vaccine.name);
  throw new BadRequestException(
    `Vaccine "${vaccineName}" is not available for species "${species ?? 'unknown'}". Allowed: ${allowed.join(', ')}`,
  );
};

// Dose defaults to (number of earlier records of the same vaccine for this pet) + 1.
export const resolveDoseNumber = async (
  client: Client,
  params: { petId: string; vaccineName: string; excludeId?: string; requested?: number | null },
): Promise<number> => {
  if (params.requested) return params.requested;

  const previous = await client.medical_history.count({
    where: {
      petId: params.petId,
      type: MedicalRecordType.VACCINE,
      vaccine_name: { equals: params.vaccineName, mode: 'insensitive' },
      ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
    },
  });
  return previous + 1;
};

// VACCINE and DEWORMING schedules are derived automatically; other types keep the provided date.
export const deriveNextDueDate = (
  type: MedicalRecordType,
  administeredAt: Date,
  doseNumber: number | null,
  provided?: Date | null,
): Date | null => {
  if (type === MedicalRecordType.VACCINE && doseNumber) {
    return calculateVaccineNextDueDate(administeredAt, doseNumber);
  }
  if (type === MedicalRecordType.DEWORMING) {
    return calculateDewormingNextDueDate(administeredAt);
  }
  return provided ?? null;
};
