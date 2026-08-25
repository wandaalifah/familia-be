import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../common/prisma/prisma.service';

export const JLogoutJob = async (
  prisma: PrismaService,
  userId: string,
): Promise<{ message: string }> => {
  try {
    // Remove the hashed refresh token from the database
    await prisma.users.update({
      where: { id: userId },
      data: { hashed_refresh_token: null },
    });

    return { message: 'Logged out successfully' };
  } catch (error) {
    console.error('Error in JLogoutJob:', error);
    throw error;
  }
};
