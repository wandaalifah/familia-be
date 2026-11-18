import { Controller, Get, Post, Patch, Delete, Param, Res, Query, Body, UseGuards } from "@nestjs/common";
import { TiersService } from "./tiers.service";
import { CExportTiersDto, CGetTiersListDto } from "./dto/list.dto";
import { xlsxFileResponse } from "../../common/helpers/xlsx-response";
import type { Response } from "express";
import { CCreateTierDto } from "./dto/create.dto";
import { CUpdateTierDto } from "./dto/update.dto";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard";
import { RolesGuard } from "../auth/guard/roles.guard";
import { Roles } from "../auth/guard/roles.decorator";
import { Role } from "@prisma/client";
import { IGlobalResponseDto } from "../../common/dto/response.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
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

  @Get('/export')
  async exportTiers(
    @Query() query: CExportTiersDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const buffer = await this.tiersService.exportTiers(query);
    return xlsxFileResponse(res, 'tiers', buffer);
  }

  @Get('/detail/:id')
  async getTierDetail(
    @Param('id') id: string,
  ): Promise<IGlobalResponseDto> {
    const result = await this.tiersService.getTierDetail(id);
    return {
      status: true,
      message: 'Success get tier detail',
      data: result,
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

  @Delete('/delete/:id')
  async deleteTier(
    @Param('id') id: string,
  ): Promise<IGlobalResponseDto> {
    const result = await this.tiersService.deleteTier(id);
    return {
      status: true,
      message: result.warning ?? 'Success delete tier',
      data: result,
    };
  }
}
