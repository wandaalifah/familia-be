import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from "@nestjs/common";
import { RewardService } from "./reward.service";
import { CGetRewardListDto } from "./dto/list.dto";
import { CCreateRewardDto } from "./dto/create.dto";
import { CUpdateRewardDto } from "./dto/update.dto";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard";
import { IGlobalResponseDto } from "../../common/dto/response.dto";

@UseGuards(JwtAuthGuard)
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