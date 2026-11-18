import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

export type RestorePetResponse = Prisma.petGetPayload<{}>;

// Un-archives a soft-deleted pet; only allowed while its owner is still active.
export const JRestorePetJob = async (
  prisma: PrismaService,
  id: string,
): Promise<RestorePetResponse> => {
  try {
    const pet = await prisma.pet.findUnique({
      where: { id },
      include: { users: { select: { deleted_at: true } } },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }
    if (pet.deleted_at === null) {
      throw new BadRequestException('Pet is not archived');
    }
    if (pet.users.deleted_at !== null) {
      throw new BadRequestException('Pet owner is no longer active; cannot restore this pet');
    }

    return await prisma.pet.update({ where: { id }, data: { deleted_at: null } });
  } catch (error) {
    console.error('Error in JRestorePetJob:', error);
    throw error;
  }
};
