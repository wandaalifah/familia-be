import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

export type DeleteTierResponse = Prisma.tiersGetPayload<{}> & {
  affected_members: number;
  warning: string | null;
};

export const JDeleteTierJob = async (
  prisma: PrismaService,
  id: string,
): Promise<DeleteTierResponse> => {
  try {
    const tier = await prisma.tiers.findUnique({
      where: { id },
      include: { _count: { select: { memberships: true } } },
    });

    if (!tier) {
      throw new NotFoundException('Tier not found');
    }

    const { _count, ...tierData } = tier;
    const affected = _count.memberships;

    // memberships.tierId is onDelete: SetNull, so members are detached, not deleted.
    await prisma.tiers.delete({ where: { id } });

    return {
      ...tierData,
      affected_members: affected,
      warning:
        affected > 0
          ? `${affected} member(s) no longer have a tier; re-sync or assign a new tier.`
          : null,
    };
  } catch (error) {
    console.error('Error in JDeleteTierJob:', error);
    throw error;
  }
};
