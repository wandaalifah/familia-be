import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { GetProfileResponse } from '../dto/get-profile.dto';

export const JGetProfileJob = async (
  prisma: PrismaService,
  userId: string,
): Promise<GetProfileResponse> => {
  try {
    const user = await prisma.users.findFirst({
      where: { id: userId, deleted_at: null },
      select: {
        id: true,
        email: true,
        phone: true,
        first_name: true,
        last_name: true,
        role: true,
        avatar: true,
        created_at: true,
        updated_at: true,
        membership: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  } catch (error) {
    console.error('Error in JGetProfileJob:', error);
    throw error;
  }
};
