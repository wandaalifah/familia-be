import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/prisma/prisma.service";
import { CGetMedicalHistoryListDto } from "./dto/list.dto";
import { CCreateMedicalHistoryDto } from "./dto/create.dto";
import { CUpdateMedicalHistoryDto } from "./dto/update.dto";
import { JGetMedicalHistoryListJob } from "./jobs/list.job";
import { JGetMedicalHistoryDetailJob } from "./jobs/detail.job";
import { JCreateMedicalHistoryJob } from "./jobs/create.job";
import { JUpdateMedicalHistoryJob } from "./jobs/update.job";
import { JDeleteMedicalHistoryJob } from "./jobs/delete.job";

@Injectable()
export class MedicalHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  getMedicalHistoryList = (
    query: CGetMedicalHistoryListDto,
  ) => JGetMedicalHistoryListJob(this.prisma, query);

  getMedicalHistoryDetail = (
    id: string,
  ) => JGetMedicalHistoryDetailJob(this.prisma, id);

  createMedicalHistory = (
    body: CCreateMedicalHistoryDto,
  ) => JCreateMedicalHistoryJob(this.prisma, body);

  updateMedicalHistory = (
    id: string,
    body: CUpdateMedicalHistoryDto,
  ) => JUpdateMedicalHistoryJob(this.prisma, id, body);

  deleteMedicalHistory = (
    id: string,
  ) => JDeleteMedicalHistoryJob(this.prisma, id);
}
