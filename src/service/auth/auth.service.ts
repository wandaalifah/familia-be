import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "src/common/prisma/prisma.service";
import { CLoginDto } from "./dto/login.dto";
import { CRefreshDto } from "./dto/refresh.dto";
import { CRegisterAdminDto } from "./dto/register-admin.dto";
import { CRegisterClientDto } from "./dto/register-client.dto";
import { CChangePasswordDto } from "./dto/change-password.dto";
import { JLoginJob } from "./jobs/login.job";
import { JChangePasswordJob } from "./jobs/change-password.job";
import { JRefreshJob } from "./jobs/refresh.job";
import { JLogoutJob } from "./jobs/logout.job";
import { JRegisterAdminJob } from "./jobs/register-admin.job";
import { JRegisterClientJob } from "./jobs/register-client.job";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  login = (body: CLoginDto) => JLoginJob(this.prisma, this.jwtService, body);

  refresh = (body: CRefreshDto) => JRefreshJob(this.prisma, this.jwtService, body);

  logout = (userId: string) => JLogoutJob(this.prisma, userId);

  registerAdmin = (body: CRegisterAdminDto) => JRegisterAdminJob(this.prisma, body);

  registerClient = (body: CRegisterClientDto) => JRegisterClientJob(this.prisma, body);

  changePassword = (userId: string, body: CChangePasswordDto) => JChangePasswordJob(this.prisma, userId, body);
}
