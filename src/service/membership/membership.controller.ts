import { Controller, Get, Post, Query, Body, UseGuards } from "@nestjs/common";
import { MembershipService } from "./membership.service";
import { CGetMembershipListDto } from "./dto/list.dto";
import { CCreateMembershipDto } from "./dto/create.dto";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard";
import { IGlobalResponseDto } from "../../common/dto/response.dto";

@UseGuards(JwtAuthGuard)
@Controller('/admin/membership')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get('/list')
  async getMembershipList(
    @Query() query: CGetMembershipListDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.membershipService.getMembershipList(query);
    return {
      status: true,
      message: 'Success get membership list',
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Post('/create')
  async createMembership(
    @Body() body: CCreateMembershipDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.membershipService.createMembership(body);
    return {
      status: true,
      message: 'Success create membership',
      data: result,
    };
  }
}