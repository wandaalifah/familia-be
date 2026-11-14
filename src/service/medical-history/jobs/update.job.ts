import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CUpdateMedicalHistoryDto, UpdateMedicalHistoryResponse } from '../dto/update.dto';

export const JUpdateMedicalHistoryJob = async (
  prisma: PrismaService,
  id: string,
  body: CUpdateMedicalHistoryDto,
): Promise<UpdateMedicalHistoryResponse> => {
  try {
    const medicalHistory = await prisma.medical_history.findUnique({
      where: { id },
    });

    if (!medicalHistory) {
      throw new NotFoundException('Medical history not found');
    }

    // Ensure the new pet exists when reassigning
    if (body.petId) {
      const pet = await prisma.pet.findFirst({
        where: { id: body.petId, deleted_at: null },
      });

      if (!pet) {
        throw new NotFoundException('Pet not found');
      }
    }

    const updatedMedicalHistory = await prisma.medical_history.update({
      where: { id },
      data: {
        ...body,
      },
    });

    return updatedMedicalHistory;
  } catch (error) {
    console.error('Error in JUpdateMedicalHistoryJob:', error);
    throw error;
  }
};
