import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { COverrideTierDto } from '../dto/override-tier.dto';

export type OverrideTierResponse = Prisma.membershipGetPayload<{ include: { tiers: true } }>;

// Admin manual tier override; always recorded in membership_tier_history.
export const JOverrideTierJob = async (
  prisma: PrismaService,
  id: string,
  body: COverrideTierDto,
): Promise<OverrideTierResponse> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const membership = await tx.membership.findUnique({
        where: { id },
        select: { tierId: true },
      });
      if (!membership) {
        throw new NotFoundException('Membership not found');
      }

      const tier = await tx.tiers.findUnique({
        where: { id: body.tierId },
        select: { id: true },
      });
      if (!tier) {
        throw new NotFoundException('Tier not found');
      }

      if (membership.tierId === tier.id) {
        throw new BadRequestException('Membership is already on this tier');
      }

      await tx.membership_tier_history.create({
        data: { membershipId: id, oldTierId: membership.tierId, newTierId: tier.id },
      });

      return tx.membership.update({
        where: { id },
        data: { tierId: tier.id },
        include: { tiers: true },
      });
    });
  } catch (error) {
    console.error('Error in JOverrideTierJob:', error);
    throw error;
  }
};
