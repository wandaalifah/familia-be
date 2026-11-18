import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

const POINTS_HISTORY_PREVIEW = 10;

const membershipDetailArgs = Prisma.validator<Prisma.membershipDefaultArgs>()({
  include: {
    users: {
      select: {
        id: true,
        email: true,
        phone: true,
        first_name: true,
        last_name: true,
        avatar: true,
        pets: { where: { deleted_at: null } },
      },
    },
    tiers: true,
    points_history: {
      orderBy: { created_at: 'desc' },
      take: POINTS_HISTORY_PREVIEW,
    },
    tier_history: {
      orderBy: { created_at: 'desc' },
      include: {
        old_tier: { select: { id: true, name: true, level: true } },
        new_tier: { select: { id: true, name: true, level: true } },
      },
    },
  },
});

export type MembershipDetail = Prisma.membershipGetPayload<typeof membershipDetailArgs>;

export const JGetMembershipDetailJob = async (
  prisma: PrismaService,
  id: string,
): Promise<MembershipDetail> => {
  try {
    const membership = await prisma.membership.findFirst({
      where: { id, users: { deleted_at: null } },
      ...membershipDetailArgs,
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    return membership;
  } catch (error) {
    console.error('Error in JGetMembershipDetailJob:', error);
    throw error;
  }
};
