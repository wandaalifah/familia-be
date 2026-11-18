import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PetDetail } from '../dto/list.dto';

export const JGetPetDetailJob = async (
  prisma: PrismaService,
  id: string,
): Promise<PetDetail> => {
  try {
    const pet = await prisma.pet.findFirst({
      where: { id, deleted_at: null },
      include: {
        users: {
          select: { id: true, first_name: true, last_name: true, phone: true, email: true },
        },
        medical_history: { orderBy: { administered_at: 'desc' } },
      },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    return pet;
  } catch (error) {
    console.error('Error in JGetPetDetailJob:', error);
    throw error;
  }
};
