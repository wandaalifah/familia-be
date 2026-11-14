import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PetItem } from '../dto/list.dto';

export const JGetPetDetailJob = async (
  prisma: PrismaService,
  id: string,
): Promise<PetItem> => {
  try {
    const pet = await prisma.pet.findFirst({
      where: { id, deleted_at: null },
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
