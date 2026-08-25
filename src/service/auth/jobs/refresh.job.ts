import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CRefreshDto, RefreshResponse } from '../dto/refresh.dto';

export const JRefreshJob = async (
  prisma: PrismaService,
  jwtService: JwtService,
  body: CRefreshDto,
): Promise<RefreshResponse> => {
  try {
    const { refresh_token } = body;

    // Verify the refresh token JWT
    let payload: any;
    try {
      payload = jwtService.verify(refresh_token);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Find user
    const user = await prisma.users.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.hashed_refresh_token) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Verify the stored hashed refresh token
    const isRefreshTokenValid = await bcrypt.compare(
      refresh_token,
      user.hashed_refresh_token,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new tokens
    const newPayload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    };

    const new_access_token = jwtService.sign(newPayload, {
      expiresIn: (process.env.JWT_ACCESS_TOKEN_EXPIRATION || '15m') as any,
    });

    const new_refresh_token = jwtService.sign(newPayload, {
      expiresIn: (process.env.JWT_REFRESH_TOKEN_EXPIRATION || '7d') as any,
    });

    // Hash and save new refresh token
    const hashedRefreshToken = await bcrypt.hash(new_refresh_token, 10);
    await prisma.users.update({
      where: { id: user.id },
      data: { hashed_refresh_token: hashedRefreshToken },
    });

    return {
      access_token: new_access_token,
      refresh_token: new_refresh_token,
    };
  } catch (error) {
    console.error('Error in JRefreshJob:', error);
    throw error;
  }
};
