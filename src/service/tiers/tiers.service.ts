import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/prisma/prisma.service";
import { TierEvaluatorService } from "src/common/loyalty/tier-evaluator.service";
import { ExcelExportService } from "src/common/services/excel-export.service";
import { CExportTiersDto, CGetTiersListDto } from "./dto/list.dto";
import { JExportTiersJob } from "./jobs/export.job";
import { CCreateTierDto } from "./dto/create.dto";
import { CUpdateTierDto } from "./dto/update.dto";
import { JGetTiersListJob } from "./jobs/list.job";
import { JGetTierDetailJob } from "./jobs/detail.job";
import { JCreateTierJob } from "./jobs/create.job";
import { JUpdateTierJob } from "./jobs/update.job";
import { JDeleteTierJob } from "./jobs/delete.job";

@Injectable()
export class TiersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tierEvaluator: TierEvaluatorService,
    private readonly excel: ExcelExportService,
  ) {}

  exportTiers = (
    query: CExportTiersDto,
  ) => JExportTiersJob(this.prisma, this.excel, query);

  getTiersList = (
    query: CGetTiersListDto,
  ) => JGetTiersListJob(this.prisma, query);

  getTierDetail = (
    id: string,
  ) => JGetTierDetailJob(this.prisma, id);

  createTier = (
    body: CCreateTierDto,
  ) => JCreateTierJob(this.prisma, body);

  updateTier = (
    id: string,
    body: CUpdateTierDto,
  ) => JUpdateTierJob(this.prisma, this.tierEvaluator, id, body);

  deleteTier = (
    id: string,
  ) => JDeleteTierJob(this.prisma, id);
}
