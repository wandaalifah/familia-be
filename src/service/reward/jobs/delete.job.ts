import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

export type DeleteRewardResponse = Prisma.couponGetPayload<{}>;

export const JDeleteRewardJob = async (
  prisma: PrismaService,
  id: string,
): Promise<DeleteRewardResponse> => {
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: { _count: { select: { redemptions: true } } },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    // redemption_history uses onDelete: Restrict; fail fast with a clear 409.
    if (coupon._count.redemptions > 0) {
      throw new ConflictException(
        'Coupon has already been redeemed and cannot be deleted',
      );
    }

    return await prisma.coupon.delete({ where: { id } });
  } catch (error) {
    console.error('Error in JDeleteRewardJob:', error);
    throw error;
  }
};
