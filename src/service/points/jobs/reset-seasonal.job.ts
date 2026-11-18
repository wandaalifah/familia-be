import { PrismaService } from '../../../common/prisma/prisma.service';

export interface ResetSeasonalResponse {
  season_year: number;
  reset_count: number;
  demoted_count: number;
}

export const SEASON_TIME_ZONE = 'Asia/Jakarta';

export const getSeasonYear = (now: Date = new Date()): number =>
  Number(
    new Intl.DateTimeFormat('en-US', { timeZone: SEASON_TIME_ZONE, year: 'numeric' }).format(now),
  );

// Year-end reset: zeroes seasonal_points for every membership and moves each member
// one tier level down (members already on the lowest tier, or without a tier, stay).
// Idempotent per year: memberships already stamped with last_season_reset = this year
// are skipped, so a repeated or concurrent run cannot demote anyone twice.
// Each membership is processed in its own transaction so one failure cannot block the rest.
export const JResetSeasonalJob = async (
  prisma: PrismaService,
  seasonYear: number = getSeasonYear(),
): Promise<ResetSeasonalResponse> => {
  try {
    const tiers = await prisma.tiers.findMany({
      orderBy: { level: 'asc' },
      select: { id: true },
    });
    const lowerTierById = new Map<string, string>(
      tiers.slice(1).map((tier, index) => [tier.id, tiers[index].id]),
    );

    const pendingFilter = {
      OR: [{ last_season_reset: null }, { last_season_reset: { lt: seasonYear } }],
    };

    const memberships = await prisma.membership.findMany({
      where: pendingFilter,
      select: { id: true, tierId: true },
    });

    let resetCount = 0;
    let demotedCount = 0;
    for (const { id, tierId } of memberships) {
      const lowerTierId = tierId ? lowerTierById.get(tierId) : undefined;

      const didReset = await prisma.$transaction(async (tx) => {
        // Conditional claim: only one runner can stamp this membership for the year
        const claimed = await tx.membership.updateMany({
          where: { id, ...pendingFilter },
          data: {
            seasonal_points: 0,
            last_season_reset: seasonYear,
            ...(lowerTierId ? { tierId: lowerTierId } : {}),
          },
        });

        if (claimed.count === 0) return false;

        if (lowerTierId) {
          await tx.membership_tier_history.create({
            data: { membershipId: id, oldTierId: tierId, newTierId: lowerTierId },
          });
        }
        return true;
      });

      if (didReset) {
        resetCount += 1;
        if (lowerTierId) demotedCount += 1;
      }
    }

    return { season_year: seasonYear, reset_count: resetCount, demoted_count: demotedCount };
  } catch (error) {
    console.error('Error in JResetSeasonalJob:', error);
    throw error;
  }
};
