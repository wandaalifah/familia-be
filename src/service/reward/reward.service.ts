import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/prisma/prisma.service";
import { ExcelExportService } from "src/common/services/excel-export.service";
import { CExportRewardDto, CGetRewardListDto } from "./dto/list.dto";
import { JExportRewardJob } from "./jobs/export.job";
import { JExportRedemptionJob } from "./jobs/redemption-export.job";
import { CCreateRewardDto } from "./dto/create.dto";
import { CUpdateRewardDto } from "./dto/update.dto";
import { CExportRedemptionDto, CGetRedemptionListDto, CRedeemRewardDto } from "./dto/redeem.dto";
import { JGetRewardListJob } from "./jobs/list.job";
import { JGetRewardDetailJob } from "./jobs/detail.job";
import { JCreateRewardJob } from "./jobs/create.job";
import { JUpdateRewardJob } from "./jobs/update.job";
import { JDeleteRewardJob } from "./jobs/delete.job";
import { JGetRedemptionListJob } from "./jobs/redemption-list.job";
import { JRedeemRewardJob } from "./jobs/redeem.job";

@Injectable()
export class RewardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly excel: ExcelExportService,
  ) {}

  exportReward = (
    query: CExportRewardDto,
  ) => JExportRewardJob(this.prisma, this.excel, query);

  exportRedemption = (
    query: CExportRedemptionDto,
  ) => JExportRedemptionJob(this.prisma, this.excel, query);

  getRewardList = (
    query: CGetRewardListDto,
  ) => JGetRewardListJob(this.prisma, query);

  getRewardDetail = (
    id: string,
  ) => JGetRewardDetailJob(this.prisma, id);

  createReward = (
    body: CCreateRewardDto,
  ) => JCreateRewardJob(this.prisma, body);

  updateReward = (
    id: string,
    body: CUpdateRewardDto,
  ) => JUpdateRewardJob(this.prisma, id, body);

  deleteReward = (
    id: string,
  ) => JDeleteRewardJob(this.prisma, id);

  getRedemptionList = (
    query: CGetRedemptionListDto,
  ) => JGetRedemptionListJob(this.prisma, query);

  redeemReward = (
    id: string,
    body: CRedeemRewardDto,
  ) => JRedeemRewardJob(this.prisma, id, body);
}
