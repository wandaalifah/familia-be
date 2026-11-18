import { Controller, Post, Body, UseGuards, Request } from "@nestjs/common";
import { Throttle } from '@nestjs/throttler';
import { AuthService } from "./auth.service";
import { CLoginDto } from "./dto/login.dto";
import { CRefreshDto } from "./dto/refresh.dto";
import { CRegisterAdminDto } from "./dto/register-admin.dto";
import { CRegisterClientDto } from "./dto/register-client.dto";
import { CChangePasswordDto } from "./dto/change-password.dto";
import { JwtAuthGuard } from "./guard/jwt-auth.guard";
import { RolesGuard } from "./guard/roles.guard";
import { Roles } from "./guard/roles.decorator";
import { Role } from "@prisma/client";

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('/login')
  login(@Body() body: CLoginDto) {
    return this.authService.login(body);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('/refresh-token')
  refresh(@Body() body: CRefreshDto) {
    return this.authService.refresh(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/logout')
  logout(@Request() req: any) {
    return this.authService.logout(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/change-password')
  changePassword(@Request() req: any, @Body() body: CChangePasswordDto) {
    return this.authService.changePassword(req.user.id, body);
  }

  // Only an existing admin can create another admin (first admin comes from `prisma db seed`)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/register-admin')
  registerAdmin(@Body() body: CRegisterAdminDto) {
    return this.authService.registerAdmin(body);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('/register-client')
  registerClient(@Body() body: CRegisterClientDto) {
    return this.authService.registerClient(body);
  }
}
