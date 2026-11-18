import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CLoginDto, LoginResponse } from '../dto/login.dto';
import { IGlobalResponseDto } from 'src/common/dto/response.dto';

// Valid bcrypt hash (cost 10) of a random string; only used to equalise timing
const DUMMY_PASSWORD_HASH = '$2b$10$5J4NxbZbFNc0I8h7Q6/hFOP3Mta/JeipmPYKhdIdXuLkHpCei9Une';

export const JLoginJob = async (
  prisma: PrismaService,
  jwtService: JwtService,
  body: CLoginDto,
): Promise<IGlobalResponseDto<LoginResponse>> => {
  try {
    const { username, password } = body;

    // Find user by email or phone (exclude soft-deleted users)
    const user = await prisma.users.findFirst({
      where: {
        deleted_at: null,
        OR: [
          { email: username },
          { phone: username },
        ],
      },
    });

    // Always run one bcrypt comparison so response time doesn't reveal whether the user exists
    const isPasswordValid = await bcrypt.compare(password, user?.password ?? DUMMY_PASSWORD_HASH);
    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Build JWT payload
    const payload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    };

    // Generate tokens
    const access_token = jwtService.sign(payload, {
      expiresIn: (process.env.JWT_ACCESS_TOKEN_EXPIRATION || '15m') as any,
    });

    const refresh_token = jwtService.sign(payload, {
      expiresIn: (process.env.JWT_REFRESH_TOKEN_EXPIRATION || '7d') as any,
    });

    // Hash and save refresh token
    const hashedRefreshToken = await bcrypt.hash(refresh_token, 10);
    await prisma.users.update({
      where: { id: user.id },
      data: { hashed_refresh_token: hashedRefreshToken },
    });

    return {
        status : true,
        message : 'Login successful',
        data: {
            access_token,
            refresh_token,
        }
    };
  } catch (error) {
    console.error('Error in JLoginJob:', error);
    throw error;
  }
};
