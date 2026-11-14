import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { MedicalHistoryItem } from '../dto/list.dto';

export const JGetMedicalHistoryDetailJob = async (
  prisma: PrismaService,
  id: string,
): Promise<MedicalHistoryItem> => {
  try {
    const medicalHistory = await prisma.medical_history.findUnique({
      where: { id },
    });

    if (!medicalHistory) {
      throw new NotFoundException('Medical history not found');
    }

    return medicalHistory;
  } catch (error) {
    console.error('Error in JGetMedicalHistoryDetailJob:', error);
    throw error;
  }
};
