import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CRegisterClientDto, RegisterClientResponse } from '../dto/register-client.dto';
import { Role } from '@prisma/client';

export const JRegisterClientJob = async (
  prisma: PrismaService,
  body: CRegisterClientDto,
): Promise<RegisterClientResponse> => {
  try {
    const { email, password, phone, first_name, last_name } = body;

    // Check if email or phone already exists
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Email or phone already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Find the tier with the lowest level for new members
    const lowestTier = await prisma.tiers.findFirst({
      orderBy: { level: 'asc' },
    });

    // Create client user and membership in a transaction
    const user = await prisma.$transaction(async (tx) => {
      // 1. Create user with role CUSTOMER
      const createdUser = await tx.users.create({
        data: {
          email,
          password: hashedPassword,
          phone,
          first_name,
          last_name,
          role: Role.CUSTOMER,
        },
      });

      // 2. Create membership linked to user and lowest tier
      await tx.membership.create({
        data: {
          userId: createdUser.id,
          tierId: lowestTier?.id ?? undefined,
        },
      });

      // 3. Return user with membership and tier
      return tx.users.findUniqueOrThrow({
        where: { id: createdUser.id },
        include: {
          membership: {
            include: {
              tiers: true,
            },
          },
        },
      });
    });

    return user;
  } catch (error) {
    console.error('Error in JRegisterClientJob:', error);
    throw error;
  }
};
