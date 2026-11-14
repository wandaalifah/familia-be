import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CChangePasswordDto, ChangePasswordResponse } from '../dto/change-password.dto';

export const JChangePasswordJob = async (
  prisma: PrismaService,
  userId: string,
  body: CChangePasswordDto,
): Promise<ChangePasswordResponse> => {
  try {
    const { old_password, new_password } = body;

    // Find the authenticated user
    const user = await prisma.users.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(old_password, user.password);

    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    // New password must be different from the old one
    if (old_password === new_password) {
      throw new BadRequestException('New password must be different from old password');
    }

    // Hash and save the new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    await prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  } catch (error) {
    console.error('Error in JChangePasswordJob:', error);
    throw error;
  }
};
