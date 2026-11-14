import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

export type DeletePetResponse = Prisma.petGetPayload<{}>;

export const JDeletePetJob = async (
  prisma: PrismaService,
  id: string,
): Promise<DeletePetResponse> => {
  try {
    const pet = await prisma.pet.findFirst({
      where: { id, deleted_at: null },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    // Soft delete
    const deletedPet = await prisma.pet.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return deletedPet;
  } catch (error) {
    console.error('Error in JDeletePetJob:', error);
    throw error;
  }
};
