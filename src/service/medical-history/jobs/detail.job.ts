import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { MedicalHistoryWithPet } from '../dto/list.dto';
import { PET_WITH_OWNER_INCLUDE } from './list.job';

export const JGetMedicalHistoryDetailJob = async (
  prisma: PrismaService,
  id: string,
): Promise<MedicalHistoryWithPet> => {
  try {
    const medicalHistory = await prisma.medical_history.findUnique({
      where: { id },
      include: PET_WITH_OWNER_INCLUDE,
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
