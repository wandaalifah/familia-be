import { PrismaService } from '../../../common/prisma/prisma.service';
import { UserPetItem } from '../dto/get-pets.dto';

export const JGetUserPetsJob = async (
  prisma: PrismaService,
  userId: string,
): Promise<UserPetItem[]> => {
  try {
    const pets = await prisma.pet.findMany({
      where: { userId, deleted_at: null },
      orderBy: { created_at: 'desc' },
      include: {
        medical_history: {
          orderBy: { administered_at: 'desc' },
        },
      },
    });

    return pets;
  } catch (error) {
    console.error('Error in JGetUserPetsJob:', error);
    throw error;
  }
};
