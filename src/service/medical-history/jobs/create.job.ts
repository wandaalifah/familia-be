import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MedicalRecordType, PointTransactionType } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { applyPointsChange } from '../../../common/loyalty/points-ledger';
import { CCreateMedicalHistoryDto, CreateMedicalHistoryResponse } from '../dto/create.dto';
import { assertVaccineAllowed, deriveNextDueDate, resolveDoseNumber } from '../vaccine-rules';

export const JCreateMedicalHistoryJob = async (
  prisma: PrismaService,
  body: CCreateMedicalHistoryDto,
): Promise<CreateMedicalHistoryResponse> => {
  try {
    const { petId, award_points, vaccine_name, dose_number, next_due_date, ...record } = body;
    const isVaccine = record.type === MedicalRecordType.VACCINE;

    // Ensure the pet exists (species drives the vaccine catalog, owner receives points)
    const pet = await prisma.pet.findFirst({
      where: { id: petId, deleted_at: null },
      select: { userId: true, species: true },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    if (isVaccine && vaccine_name) {
      assertVaccineAllowed(vaccine_name, pet.species);
    }

    return await prisma.$transaction(async (tx) => {
      const resolvedDose =
        isVaccine && vaccine_name
          ? await resolveDoseNumber(tx, { petId, vaccineName: vaccine_name, requested: dose_number })
          : null;
      const administeredAt = new Date(record.administered_at);

      const medicalHistory = await tx.medical_history.create({
        data: {
          ...record,
          petId,
          vaccine_name: isVaccine ? vaccine_name : null,
          dose_number: resolvedDose,
          next_due_date: deriveNextDueDate(
            record.type,
            administeredAt,
            resolvedDose,
            next_due_date ? new Date(next_due_date) : null,
          ),
        },
      });

      if (award_points) {
        const membership = await tx.membership.findUnique({
          where: { userId: pet.userId },
          select: { id: true },
        });

        if (!membership) {
          throw new BadRequestException(
            'Pet owner has no membership; cannot award points',
          );
        }

        await applyPointsChange(tx, {
          membershipId: membership.id,
          amount: award_points,
          type: PointTransactionType.EARNED,
          description: `Treatment: ${record.title}`,
          referenceId: medicalHistory.id,
        });
      }

      return medicalHistory;
    });
  } catch (error) {
    console.error('Error in JCreateMedicalHistoryJob:', error);
    throw error;
  }
};
