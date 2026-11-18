import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CCreatePetDto, CreatePetResponse } from '../dto/create.dto';

export const JCreatePetJob = async (
  prisma: PrismaService,
  body: CCreatePetDto,
): Promise<CreatePetResponse> => {
  try {
    const { userId, name, species, breed, birth_date, is_neutered, avatar } = body;

    // Ensure the owner exists and is not soft-deleted
    const user = await prisma.users.findFirst({
      where: { id: userId, deleted_at: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const pet = await prisma.pet.create({
      data: {
        userId,
        name,
        species,
        breed,
        birth_date,
        is_neutered,
        avatar,
      },
    });

    return pet;
  } catch (error) {
    console.error('Error in JCreatePetJob:', error);
    throw error;
  }
};
