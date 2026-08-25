import { PrismaService } from '../../../common/prisma/prisma.service';
import { CUpdateRewardDto, UpdateRewardResponse } from '../dto/update.dto';

export const JUpdateRewardJob = async (
  prisma: PrismaService,
  id: string,
  body: CUpdateRewardDto,
): Promise<UpdateRewardResponse> => {
  try {
    const reward = await prisma.coupon.update({
      where: { id },
      data: {
        ...body,
      },
    });

    return reward;
  } catch (error) {
    console.error('Error in JUpdateRewardJob:', error);
    throw error;
  }
};
