import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { PointsService } from "./points.service";
import { CGetPointsHistoryListDto } from "./dto/list.dto";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard";
import { IGlobalResponseDto } from "../../common/dto/response.dto";

@UseGuards(JwtAuthGuard)
@Controller('/admin/points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

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