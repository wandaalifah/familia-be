import { PrismaService } from '../../../common/prisma/prisma.service';
import { CCreateTierDto, CreateTierResponse } from '../dto/create.dto';

export const JCreateTierJob = async (
  prisma: PrismaService,
  body: CCreateTierDto,
): Promise<CreateTierResponse> => {
  try {
    const { name, description, level, required_points } = body;

    const tier = await prisma.tiers.create({
      data: {
        name,
        description,
        level,
        required_points,
      },
    });

    return tier;
  } catch (error) {
    console.error('Error in JCreateTierJob:', error);
    throw error;
  }
};
