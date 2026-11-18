import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CUpdateMemberDto } from '../dto/update.dto';
import { MembershipItem } from '../dto/list.dto';
import { MEMBERSHIP_LIST_INCLUDE } from './list.job';

// Updates the member's user profile. A duplicate email/phone raises Prisma P2002,
// which the global PrismaClientExceptionFilter maps to 409 Conflict.
export const JUpdateMemberJob = async (
  prisma: PrismaService,
  id: string,
  body: CUpdateMemberDto,
): Promise<MembershipItem> => {
  try {
    const membership = await prisma.membership.findFirst({
      where: { id, users: { deleted_at: null } },
      select: { userId: true },
    });

    if (!membership) {
      throw new NotFoundException('Member not found');
    }

    await prisma.users.update({ where: { id: membership.userId }, data: body });

    return await prisma.membership.findUniqueOrThrow({
      where: { id },
      include: MEMBERSHIP_LIST_INCLUDE,
    });
  } catch (error) {
    console.error('Error in JUpdateMemberJob:', error);
    throw error;
  }
};
