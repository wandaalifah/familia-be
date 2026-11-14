import { PrismaService } from '../../../common/prisma/prisma.service';
import { CCreateRewardDto, CreateRewardResponse } from '../dto/create.dto';

export const JCreateRewardJob = async (
  prisma: PrismaService,
  body: CCreateRewardDto,
): Promise<CreateRewardResponse> => {
  try {
    const { title, description, points_cost } = body;

    const reward = await prisma.coupon.create({
      data: {
        title,
        description,
        points_cost,
      },
    });

    return reward;
  } catch (error) {
    console.error('Error in JCreateRewardJob:', error);
    throw error;
  }
};
