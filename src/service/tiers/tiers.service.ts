import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/prisma/prisma.service";
import { CGetTiersListDto } from "./dto/list.dto";
import { CCreateTierDto } from "./dto/create.dto";
import { CUpdateTierDto } from "./dto/update.dto";
import { JGetTiersListJob } from "./jobs/list.job";
import { JCreateTierJob } from "./jobs/create.job";
import { JUpdateTierJob } from "./jobs/update.job";

@Injectable()
export class TiersService {
  constructor(private readonly prisma: PrismaService) {}

  getTiersList = (
    query: CGetTiersListDto,
  ) => JGetTiersListJob(this.prisma, query);

  createTier = (
    body: CCreateTierDto,
  ) => JCreateTierJob(this.prisma, body);

  updateTier = (
    id: string,
    body: CUpdateTierDto,
  ) => JUpdateTierJob(this.prisma, id, body);
}