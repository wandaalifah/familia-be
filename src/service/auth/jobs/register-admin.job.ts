import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CRegisterAdminDto, RegisterAdminResponse } from '../dto/register-admin.dto';
import { Role } from '@prisma/client';

export const JRegisterAdminJob = async (
  prisma: PrismaService,
  body: CRegisterAdminDto,
): Promise<RegisterAdminResponse> => {
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

    // Create admin user
    const user = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        phone,
        first_name,
        last_name,
        role: Role.ADMIN,
      },
    });

    return user;
  } catch (error) {
    console.error('Error in JRegisterAdminJob:', error);
    throw error;
  }
};
