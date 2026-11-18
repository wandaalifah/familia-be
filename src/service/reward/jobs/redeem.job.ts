import { NotFoundException } from '@nestjs/common';
import { PointTransactionType } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { applyPointsChange, PointsChangeResult } from '../../../common/loyalty/points-ledger';
import { CRedeemRewardDto, RedemptionItem } from '../dto/redeem.dto';

export interface RedeemRewardResponse {
  redemption: RedemptionItem;
  balance: Pick<PointsChangeResult, 'points' | 'seasonal_points'>;
}

// Admin-assisted redemption: one atomic transaction covering the redemption
// record, the points deduction (rolled back if balance is insufficient) and the ledger entry.
export const JRedeemRewardJob = async (
  prisma: PrismaService,
  couponId: string,
  body: CRedeemRewardDto,
): Promise<RedeemRewardResponse> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const coupon = await tx.coupon.findUnique({ where: { id: couponId } });
      if (!coupon) {
        throw new NotFoundException('Coupon not found');
      }

      const membership = await tx.membership.findFirst({
        where: { userId: body.userId, users: { deleted_at: null } },
        select: { id: true },
      });
      if (!membership) {
        throw new NotFoundException('Membership not found for this customer');
      }

      const redemption = await tx.redemption_history.create({
        data: { userId: body.userId, couponId, points_spent: coupon.points_cost },
        include: {
          users: {
            select: { id: true, email: true, phone: true, first_name: true, last_name: true },
          },
          coupon: { select: { id: true, title: true, points_cost: true } },
        },
      });

      const change = await applyPointsChange(tx, {
        membershipId: membership.id,
        amount: -coupon.points_cost,
        type: PointTransactionType.REDEEMED,
        description: `Redeemed coupon: ${coupon.title}`,
        referenceId: redemption.id,
      });

      return {
        redemption,
        balance: { points: change.points, seasonal_points: change.seasonal_points },
      };
    });
  } catch (error) {
    console.error('Error in JRedeemRewardJob:', error);
    throw error;
  }
};
