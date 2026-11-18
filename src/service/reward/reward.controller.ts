import { Controller, Get, Post, Patch, Delete, Param, Res, Query, Body, UseGuards } from "@nestjs/common";
import { RewardService } from "./reward.service";
import { CExportRewardDto, CGetRewardListDto } from "./dto/list.dto";
import { CCreateRewardDto } from "./dto/create.dto";
import { CUpdateRewardDto } from "./dto/update.dto";
import { CExportRedemptionDto, CGetRedemptionListDto, CRedeemRewardDto } from "./dto/redeem.dto";
import type { Response } from "express";
import { xlsxFileResponse } from "../../common/helpers/xlsx-response";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard";
import { RolesGuard } from "../auth/guard/roles.guard";
import { Roles } from "../auth/guard/roles.decorator";
import { Role } from "@prisma/client";
import { IGlobalResponseDto } from "../../common/dto/response.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('/admin/reward')
export class RewardController {
  constructor(private readonly rewardService: RewardService) {}

  @Get('/list')
  async getRewardList(
    @Query() query: CGetRewardListDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.rewardService.getRewardList(query);
    return {
      status: true,
      message: 'Success get reward list',
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Get('/detail/:id')
  async getRewardDetail(
    @Param('id') id: string,
  ): Promise<IGlobalResponseDto> {
    const result = await this.rewardService.getRewardDetail(id);
    return {
      status: true,
      message: 'Success get reward detail',
      data: result,
    };
  }

  @Get('/export')
  async exportReward(
    @Query() query: CExportRewardDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const buffer = await this.rewardService.exportReward(query);
    return xlsxFileResponse(res, 'coupons', buffer);
  }

  @Get('/redemptions/export')
  async exportRedemption(
    @Query() query: CExportRedemptionDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const buffer = await this.rewardService.exportRedemption(query);
    return xlsxFileResponse(res, 'redemptions', buffer);
  }

  @Get('/redemptions')
  async getRedemptionList(
    @Query() query: CGetRedemptionListDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.rewardService.getRedemptionList(query);
    return {
      status: true,
      message: 'Success get redemption list',
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Post('/redeem/:id')
  async redeemReward(
    @Param('id') id: string,
    @Body() body: CRedeemRewardDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.rewardService.redeemReward(id, body);
    return {
      status: true,
      message: 'Success redeem reward',
      data: result,
    };
  }

  @Post('/create')
  async createReward(
    @Body() body: CCreateRewardDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.rewardService.createReward(body);
    return {
      status: true,
      message: 'Success create reward',
      data: result,
    };
  }

  @Patch('/update/:id')
  async updateReward(
    @Param('id') id: string,
    @Body() body: CUpdateRewardDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.rewardService.updateReward(id, body);
    return {
      status: true,
      message: 'Success update reward',
      data: result,
    };
  }

  @Delete('/delete/:id')
  async deleteReward(
    @Param('id') id: string,
  ): Promise<IGlobalResponseDto> {
    const result = await this.rewardService.deleteReward(id);
    return {
      status: true,
      message: 'Success delete reward',
      data: result,
    };
  }
}