import { Controller, Get, Post, Body, Query, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { xlsxFileResponse } from "../../common/helpers/xlsx-response";
import { CAdjustPointsDto } from "./dto/adjust.dto";
import { PointsService } from "./points.service";
import { CExportPointsHistoryDto, CGetPointsHistoryListDto } from "./dto/list.dto";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard";
import { RolesGuard } from "../auth/guard/roles.guard";
import { Roles } from "../auth/guard/roles.decorator";
import { Role } from "@prisma/client";
import { IGlobalResponseDto } from "../../common/dto/response.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('/admin/points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Post('/adjust')
  async adjustPoints(
    @Body() body: CAdjustPointsDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.pointsService.adjustPoints(body);
    return {
      status: true,
      message: 'Success adjust points',
      data: result,
    };
  }

  @Get('/history/export')
  async exportPointsHistory(
    @Query() query: CExportPointsHistoryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const buffer = await this.pointsService.exportPointsHistory(query);
    return xlsxFileResponse(res, 'points-history', buffer);
  }

  @Get('/history')
  async getPointsHistoryList(
    @Query() query: CGetPointsHistoryListDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.pointsService.getPointsHistoryList(query);
    return {
      status: true,
      message: 'Success get points history list',
      data: result.data,
      pagination: result.pagination,
    };
  }
}