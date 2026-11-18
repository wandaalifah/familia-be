import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CInitMembershipDto } from '../dto/init.dto';

export type InitMembershipResponse = Prisma.membershipGetPayload<{
  include: { tiers: true };
}>;

// Creates a membership for an existing customer, assigned to the lowest-level tier.
export const JInitMembershipJob = async (
  prisma: PrismaService,
  body: CInitMembershipDto,
): Promise<InitMembershipResponse> => {
  try {
    const user = await prisma.users.findFirst({
      where: { id: body.userId, deleted_at: null },
      include: { membership: { select: { id: true } } },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== Role.CUSTOMER) {
      throw new BadRequestException('Membership can only be created for customers');
    }
    if (user.membership) {
      throw new ConflictException('User already has a membership');
    }

    const lowestTier = await prisma.tiers.findFirst({ orderBy: { level: 'asc' } });

    return await prisma.$transaction(async (tx) => {
      const membership = await tx.membership.create({
        data: { userId: user.id, tierId: lowestTier?.id },
        include: { tiers: true },
      });

      if (lowestTier) {
        await tx.membership_tier_history.create({
          data: { membershipId: membership.id, oldTierId: null, newTierId: lowestTier.id },
        });
      }

      return membership;
    });
  } catch (error) {
    console.error('Error in JInitMembershipJob:', error);
    throw error;
  }
};
