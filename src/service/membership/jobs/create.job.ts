import { PrismaService } from '../../../common/prisma/prisma.service';
import { CCreateMembershipDto, CreateMembershipResponse } from '../dto/create.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export const JCreateMembershipJob = async (
  prisma: PrismaService,
  body: CCreateMembershipDto,
): Promise<CreateMembershipResponse> => {
  try {
    const { email, phone, first_name, last_name } = body;

    // Find the tier with the lowest level
    const lowestTier = await prisma.tiers.findFirst({
      orderBy: { level: 'asc' },
    });

    // Hash default password
    const defaultPassword = await bcrypt.hash('secret123', 10);

    // Create user and membership in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create user with role CUSTOMER
      const user = await tx.users.create({
        data: {
          email,
          password: defaultPassword,
          phone,
          first_name,
          last_name: last_name ?? '',
          role: Role.CUSTOMER,
        },
      });

      // 2. Create membership linked to user and lowest tier
      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          tierId: lowestTier?.id ?? undefined,
        },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              phone: true,
              first_name: true,
              last_name: true,
              role: true,
            },
          },
          tiers: {
            select: {
              id: true,
              name: true,
              required_points: true,
            },
          },
        },
      });

      return membership;
    });

    return result;
  } catch (error) {
    console.error('Error in JCreateMembershipJob:', error);
    throw error;
  }
};
