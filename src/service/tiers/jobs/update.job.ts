import { PrismaService } from '../../../common/prisma/prisma.service';
import { CUpdateTierDto, UpdateTierResponse } from '../dto/update.dto';

export const JUpdateTierJob = async (
  prisma: PrismaService,
  id: string,
  body: CUpdateTierDto,
): Promise<UpdateTierResponse> => {
  try {
    const tier = await prisma.tiers.update({
      where: { id },
      data: {
        ...body,
      },
    });

    return tier;
  } catch (error) {
    console.error('Error in JUpdateTierJob:', error);
    throw error;
  }
};
