import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/prisma/prisma.service";
import { CGetPointsHistoryListDto } from "./dto/list.dto";
import { JGetPointsHistoryListJob } from "./jobs/list.job";

@Injectable()
export class PointsService {
  constructor(private readonly prisma: PrismaService) {}

  getPointsHistoryList = (
    query: CGetPointsHistoryListDto,
  ) => JGetPointsHistoryListJob(this.prisma, query);
}