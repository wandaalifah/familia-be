import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/prisma/prisma.service";
import { CGetRewardListDto } from "./dto/list.dto";
import { CCreateRewardDto } from "./dto/create.dto";
import { CUpdateRewardDto } from "./dto/update.dto";
import { JGetRewardListJob } from "./jobs/list.job";
import { JCreateRewardJob } from "./jobs/create.job";
import { JUpdateRewardJob } from "./jobs/update.job";
import { JDeleteRewardJob } from "./jobs/delete.job";

@Injectable()
export class RewardService {
  constructor(private readonly prisma: PrismaService) {}

  getRewardList = (
    query: CGetRewardListDto,
  ) => JGetRewardListJob(this.prisma, query);

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
}