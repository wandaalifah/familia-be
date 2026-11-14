import { Controller, Get, Patch, Body, Query, Request, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { UserService } from "./user.service";
import { CUpdateProfileDto } from "./dto/update-profile.dto";
import { CGetUserPointsHistoryDto } from "./dto/get-points-history.dto";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard";
import { RolesGuard } from "../auth/guard/roles.guard";
import { Roles } from "../auth/guard/roles.decorator";
import { IGlobalResponseDto } from "../../common/dto/response.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(Role.CUSTOMER)
  @Get('/profile')
  async getProfile(@Request() req: any): Promise<IGlobalResponseDto> {
    const result = await this.userService.getProfile(req.user.id);
    return {
      status: true,
      message: 'Success get profile',
      data: result,
    };
  }

  @Roles(Role.CUSTOMER)
  @Get('/pets')
  async getUserPets(@Request() req: any): Promise<IGlobalResponseDto> {
    const result = await this.userService.getUserPets(req.user.id);
    return {
      status: true,
      message: 'Success get user pets',
      data: result,
    };
  }

  @Roles(Role.CUSTOMER)
  @Get('/points/history')
  async getUserPointsHistory(
    @Request() req: any,
    @Query() query: CGetUserPointsHistoryDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.userService.getUserPointsHistory(req.user.id, query);
    return {
      status: true,
      message: 'Success get user points history',
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Roles(Role.CUSTOMER)
  @Patch('/profile')
  async updateProfile(
    @Request() req: any,
    @Body() body: CUpdateProfileDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.userService.updateProfile(req.user.id, body);
    return {
      status: true,
      message: 'Success update profile',
      data: result,
    };
  }
}
