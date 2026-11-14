import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CUpdateProfileDto, UpdateProfileResponse } from '../dto/update-profile.dto';

export const JUpdateProfileJob = async (
  prisma: PrismaService,
  userId: string,
  body: CUpdateProfileDto,
): Promise<UpdateProfileResponse> => {
  try {
    const user = await prisma.users.findFirst({
      where: { id: userId, deleted_at: null },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check email/phone uniqueness when changed
    const orConditions: Prisma.usersWhereInput[] = [];
    if (body.email) orConditions.push({ email: body.email });
    if (body.phone) orConditions.push({ phone: body.phone });

    if (orConditions.length > 0) {
      const existingUser = await prisma.users.findFirst({
        where: {
          id: { not: userId },
          OR: orConditions,
        },
      });

      if (existingUser) {
        throw new ConflictException('Email or phone already exists');
      }
    }

    // Update profile and return safe fields only (no password/token hashes)
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        ...body,
      },
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
      },
    });

    return updatedUser;
  } catch (error) {
    console.error('Error in JUpdateProfileJob:', error);
    throw error;
  }
};
