import { PrismaService } from '../../../common/prisma/prisma.service';

export interface DeleteRewardResponse {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  created_at: Date;
  updated_at: Date;
}

export const JDeleteRewardJob = async (
  prisma: PrismaService,
  id: string,
): Promise<DeleteRewardResponse> => {
  try {
    const reward = await prisma.coupon.delete({
      where: { id },
    });

    return reward;
  } catch (error) {
    console.error('Error in JDeleteRewardJob:', error);
    throw error;
  }
};
