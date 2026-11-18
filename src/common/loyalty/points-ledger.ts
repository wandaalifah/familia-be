import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PointTransactionType, Prisma } from '@prisma/client';
import { evaluateMembershipTier, TierEvaluationResult } from './tier-evaluator';

export interface PointsChangeInput {
  membershipId: string;
  amount: number;
  type: PointTransactionType;
  description?: string;
  referenceId?: string;
}

export interface PointsChangeResult {
  history: Prisma.points_historyGetPayload<{}>;
  points: number;
  seasonal_points: number;
  tier: TierEvaluationResult;
}

/**
 * Atomically applies a points change. Must run inside the caller's transaction:
 *  1. increments points (and seasonal_points when amount > 0),
 *  2. rejects (rolling back) if the balance would go negative,
 *  3. writes the points_history ledger row,
 *  4. re-evaluates the tier.
 */
export const applyPointsChange = async (
  tx: Prisma.TransactionClient,
  input: PointsChangeInput,
): Promise<PointsChangeResult> => {
  const { membershipId, amount, type, description, referenceId } = input;

  if (!Number.isInteger(amount) || amount === 0) {
    throw new BadRequestException('Amount must be a non-zero integer');
  }

  const exists = await tx.membership.findUnique({
    where: { id: membershipId },
    select: { id: true },
  });
  if (!exists) {
    throw new NotFoundException('Membership not found');
  }

  // Atomic increment avoids lost updates under concurrent requests.
  const updated = await tx.membership.update({
    where: { id: membershipId },
    data: {
      points: { increment: amount },
      ...(amount > 0 ? { seasonal_points: { increment: amount } } : {}),
    },
    select: { points: true, seasonal_points: true },
  });

  if (updated.points < 0) {
    throw new BadRequestException('Insufficient points balance');
  }

  const history = await tx.points_history.create({
    data: {
      membershipId,
      amount,
      type,
      description,
      reference_id: referenceId,
    },
  });

  const tier = await evaluateMembershipTier(tx, membershipId);

  return { history, points: updated.points, seasonal_points: updated.seasonal_points, tier };
};
