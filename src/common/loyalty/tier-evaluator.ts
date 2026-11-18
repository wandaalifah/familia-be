import { Prisma } from '@prisma/client';

export interface TierEvaluationResult {
  changed: boolean;
  oldTierId: string | null;
  newTierId: string | null;
}

/**
 * Re-evaluates a membership's tier from its seasonal_points. Promotion only:
 * picks the highest tier whose required_points <= seasonal_points and moves the
 * member up when that tier outranks the current one. Demotion never happens here;
 * it is applied once a year by the seasonal reset.
 * Must run inside the caller's transaction.
 */
export const evaluateMembershipTier = async (
  tx: Prisma.TransactionClient,
  membershipId: string,
): Promise<TierEvaluationResult> => {
  const membership = await tx.membership.findUniqueOrThrow({
    where: { id: membershipId },
    select: { tierId: true, seasonal_points: true, tiers: { select: { level: true } } },
  });

  const target = await tx.tiers.findFirst({
    where: { required_points: { lte: membership.seasonal_points } },
    orderBy: { level: 'desc' },
    select: { id: true, level: true },
  });

  const oldTierId = membership.tierId;
  const currentLevel = membership.tiers?.level ?? null;
  const isPromotion = target !== null && (currentLevel === null || target.level > currentLevel);

  if (!target || !isPromotion) {
    return { changed: false, oldTierId, newTierId: oldTierId };
  }

  await tx.membership.update({
    where: { id: membershipId },
    data: { tierId: target.id },
  });
  await tx.membership_tier_history.create({
    data: { membershipId, oldTierId, newTierId: target.id },
  });

  return { changed: true, oldTierId, newTierId: target.id };
};
