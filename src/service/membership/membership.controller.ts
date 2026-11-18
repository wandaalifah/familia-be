import { Controller, Get, Post, Patch, Delete, Param, Res, Query, Body, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { CUpdateMemberDto } from "./dto/update.dto";
import { xlsxFileResponse } from "../../common/helpers/xlsx-response";
import { CInitMembershipDto } from "./dto/init.dto";
import { COverrideTierDto } from "./dto/override-tier.dto";
import { MembershipService } from "./membership.service";
import { CExportMembershipDto, CGetMembershipListDto } from "./dto/list.dto";
import { CCreateMembershipDto } from "./dto/create.dto";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard";
import { RolesGuard } from "../auth/guard/roles.guard";
import { Roles } from "../auth/guard/roles.decorator";
import { Role } from "@prisma/client";
import { IGlobalResponseDto } from "../../common/dto/response.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
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

  @Get('/export')
  async exportMembership(
    @Query() query: CExportMembershipDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const buffer = await this.membershipService.exportMembership(query);
    return xlsxFileResponse(res, 'memberships', buffer);
  }

  @Patch('/update/:id')
  async updateMember(
    @Param('id') id: string,
    @Body() body: CUpdateMemberDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.membershipService.updateMember(id, body);
    return {
      status: true,
      message: 'Member updated successfully',
      data: result,
    };
  }

  @Delete('/delete/:id')
  async deleteMember(
    @Param('id') id: string,
  ): Promise<IGlobalResponseDto> {
    const result = await this.membershipService.deleteMember(id);
    return {
      status: true,
      message: 'Member deleted successfully',
      data: result,
    };
  }

  @Get('/detail/:id')
  async getMembershipDetail(
    @Param('id') id: string,
  ): Promise<IGlobalResponseDto> {
    const result = await this.membershipService.getMembershipDetail(id);
    return {
      status: true,
      message: 'Success get membership detail',
      data: result,
    };
  }

  @Post('/init')
  async initMembership(
    @Body() body: CInitMembershipDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.membershipService.initMembership(body);
    return {
      status: true,
      message: 'Success initialize membership',
      data: result,
    };
  }

  @Patch('/tier/:id')
  async overrideTier(
    @Param('id') id: string,
    @Body() body: COverrideTierDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.membershipService.overrideTier(id, body);
    return {
      status: true,
      message: 'Success override membership tier',
      data: result,
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