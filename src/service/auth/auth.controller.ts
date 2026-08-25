import { Controller, Post, Body, UseGuards, Request } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CLoginDto } from "./dto/login.dto";
import { CRefreshDto } from "./dto/refresh.dto";
import { CRegisterAdminDto } from "./dto/register-admin.dto";
import { JwtAuthGuard } from "./guard/jwt-auth.guard";

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  login(@Body() body: CLoginDto) {
    return this.authService.login(body);
  }

  @Post('/refresh-token')
  refresh(@Body() body: CRefreshDto) {
    return this.authService.refresh(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/logout')
  logout(@Request() req: any) {
    return this.authService.logout(req.user.id);
  }

  @Post('/register-admin')
  registerAdmin(@Body() body: CRegisterAdminDto) {
    return this.authService.registerAdmin(body);
  }
}
