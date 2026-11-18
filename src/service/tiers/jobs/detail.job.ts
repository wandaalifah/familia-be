import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

const tierDetailArgs = Prisma.validator<Prisma.tiersDefaultArgs>()({
  include: {
    memberships: {
      select: {
        id: true,
        points: true,
        seasonal_points: true,
        users: {
          select: { id: true, email: true, phone: true, first_name: true, last_name: true },
        },
      },
    },
  },
});

export type TierDetail = Prisma.tiersGetPayload<typeof tierDetailArgs>;

export const JGetTierDetailJob = async (
  prisma: PrismaService,
  id: string,
): Promise<TierDetail> => {
  try {
    const tier = await prisma.tiers.findUnique({ where: { id }, ...tierDetailArgs });

    if (!tier) {
      throw new NotFoundException('Tier not found');
    }

    return tier;
  } catch (error) {
    console.error('Error in JGetTierDetailJob:', error);
    throw error;
  }
};
