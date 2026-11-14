import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CCreateMedicalHistoryDto, CreateMedicalHistoryResponse } from '../dto/create.dto';

export const JCreateMedicalHistoryJob = async (
  prisma: PrismaService,
  body: CCreateMedicalHistoryDto,
): Promise<CreateMedicalHistoryResponse> => {
  try {
    const {
      petId,
      type,
      title,
      description,
      vaccine_name,
      administered_at,
      next_due_date,
      discharged_at,
      notes,
      doctor_name,
    } = body;

    // Ensure the pet exists
    const pet = await prisma.pet.findFirst({
      where: { id: petId, deleted_at: null },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    const medicalHistory = await prisma.medical_history.create({
      data: {
        petId,
        type,
        title,
        description,
        vaccine_name,
        administered_at,
        next_due_date,
        discharged_at,
        notes,
        doctor_name,
      },
    });

    return medicalHistory;
  } catch (error) {
    console.error('Error in JCreateMedicalHistoryJob:', error);
    throw error;
  }
};
