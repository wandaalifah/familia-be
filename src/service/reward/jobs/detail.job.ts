import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

const rewardDetailArgs = Prisma.validator<Prisma.couponDefaultArgs>()({
  include: {
    redemptions: {
      orderBy: { created_at: 'desc' },
      include: {
        users: {
          select: { id: true, email: true, phone: true, first_name: true, last_name: true },
        },
      },
    },
  },
});

export type RewardDetail = Prisma.couponGetPayload<typeof rewardDetailArgs>;

export const JGetRewardDetailJob = async (
  prisma: PrismaService,
  id: string,
): Promise<RewardDetail> => {
  try {
    const reward = await prisma.coupon.findUnique({ where: { id }, ...rewardDetailArgs });

    if (!reward) {
      throw new NotFoundException('Coupon not found');
    }

    return reward;
  } catch (error) {
    console.error('Error in JGetRewardDetailJob:', error);
    throw error;
  }
};
