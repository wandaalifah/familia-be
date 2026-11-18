import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Role } from '@prisma/client';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { RolesGuard } from './guard/roles.guard';
import { ROLES_KEY } from './guard/roles.decorator';

describe('AuthController register-admin', () => {
  const handler = AuthController.prototype.registerAdmin;

  it('requires an authenticated admin', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toEqual([JwtAuthGuard, RolesGuard]);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([Role.ADMIN]);
  });
});
