import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

export interface DeleteMemberResponse {
  id: string;
  userId: string;
  deleted_at: Date;
}

// Soft delete: the user is hidden from members and pets lists, can no longer log in
// (login and token refresh already exclude deleted users) and loses the refresh token.
// Points, redemptions and medical history stay intact for audit.
export const JDeleteMemberJob = async (
  prisma: PrismaService,
  id: string,
): Promise<DeleteMemberResponse> => {
  try {
    const membership = await prisma.membership.findFirst({
      where: { id, users: { deleted_at: null } },
      select: { userId: true },
    });

    if (!membership) {
      throw new NotFoundException('Member not found');
    }

    const deletedAt = new Date();
    await prisma.users.update({
      where: { id: membership.userId },
      data: { deleted_at: deletedAt, hashed_refresh_token: null },
    });

    return { id, userId: membership.userId, deleted_at: deletedAt };
  } catch (error) {
    console.error('Error in JDeleteMemberJob:', error);
    throw error;
  }
};
