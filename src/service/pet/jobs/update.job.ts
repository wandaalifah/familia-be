import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CUpdatePetDto, UpdatePetResponse } from '../dto/update.dto';

export const JUpdatePetJob = async (
  prisma: PrismaService,
  id: string,
  body: CUpdatePetDto,
): Promise<UpdatePetResponse> => {
  try {
    const pet = await prisma.pet.findFirst({
      where: { id, deleted_at: null },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    const updatedPet = await prisma.pet.update({
      where: { id },
      data: {
        ...body,
      },
    });

    return updatedPet;
  } catch (error) {
    console.error('Error in JUpdatePetJob:', error);
    throw error;
  }
};
