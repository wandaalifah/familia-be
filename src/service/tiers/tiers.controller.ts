import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from "@nestjs/common";
import { TiersService } from "./tiers.service";
import { CGetTiersListDto } from "./dto/list.dto";
import { CCreateTierDto } from "./dto/create.dto";
import { CUpdateTierDto } from "./dto/update.dto";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard";
import { IGlobalResponseDto } from "../../common/dto/response.dto";

@UseGuards(JwtAuthGuard)
@Controller('/admin/tiers')
export class TiersController {
  constructor(private readonly tiersService: TiersService) {}

  @Get('/list')
  async getTiersList(
    @Query() query: CGetTiersListDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.tiersService.getTiersList(query);
    return {
      status: true,
      message: 'Success get tiers list',
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Post('/create')
  async createTier(
    @Body() body: CCreateTierDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.tiersService.createTier(body);
    return {
      status: true,
      message: 'Success create tier',
      data: result,
    };
  }

  @Patch('/update/:id')
  async updateTier(
    @Param('id') id: string,
    @Body() body: CUpdateTierDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.tiersService.updateTier(id, body);
    return {
      status: true,
      message: 'Success update tier',
      data: result,
    };
  }
}