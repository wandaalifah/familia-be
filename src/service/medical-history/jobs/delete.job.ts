import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

export type DeleteMedicalHistoryResponse = Prisma.medical_historyGetPayload<{}>;

export const JDeleteMedicalHistoryJob = async (
  prisma: PrismaService,
  id: string,
): Promise<DeleteMedicalHistoryResponse> => {
  try {
    const medicalHistory = await prisma.medical_history.findUnique({
      where: { id },
    });

    if (!medicalHistory) {
      throw new NotFoundException('Medical history not found');
    }

    const deletedMedicalHistory = await prisma.medical_history.delete({
      where: { id },
    });

    return deletedMedicalHistory;
  } catch (error) {
    console.error('Error in JDeleteMedicalHistoryJob:', error);
    throw error;
  }
};
