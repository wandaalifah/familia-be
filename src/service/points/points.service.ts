import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/prisma/prisma.service";
import { ExcelExportService } from "src/common/services/excel-export.service";
import { CExportPointsHistoryDto, CGetPointsHistoryListDto } from "./dto/list.dto";
import { JExportPointsHistoryJob } from "./jobs/export.job";
import { CAdjustPointsDto } from "./dto/adjust.dto";
import { JGetPointsHistoryListJob } from "./jobs/list.job";
import { JAdjustPointsJob } from "./jobs/adjust.job";
import { JResetSeasonalJob } from "./jobs/reset-seasonal.job";

@Injectable()
export class PointsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly excel: ExcelExportService,
  ) {}

  exportPointsHistory = (
    query: CExportPointsHistoryDto,
  ) => JExportPointsHistoryJob(this.prisma, this.excel, query);

  getPointsHistoryList = (
    query: CGetPointsHistoryListDto,
  ) => JGetPointsHistoryListJob(this.prisma, query);

  adjustPoints = (
    body: CAdjustPointsDto,
  ) => JAdjustPointsJob(this.prisma, body);

  resetSeasonal = () => JResetSeasonalJob(this.prisma);
}
