import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/prisma/prisma.service";
import { ExcelExportService } from "src/common/services/excel-export.service";
import { CExportMembershipDto, CGetMembershipListDto } from "./dto/list.dto";
import { CUpdateMemberDto } from "./dto/update.dto";
import { JExportMembershipJob } from "./jobs/export.job";
import { JUpdateMemberJob } from "./jobs/update.job";
import { JDeleteMemberJob } from "./jobs/delete.job";
import { CCreateMembershipDto } from "./dto/create.dto";
import { CInitMembershipDto } from "./dto/init.dto";
import { COverrideTierDto } from "./dto/override-tier.dto";
import { JGetMembershipListJob } from "./jobs/list.job";
import { JGetMembershipDetailJob } from "./jobs/detail.job";
import { JCreateMembershipJob } from "./jobs/create.job";
import { JInitMembershipJob } from "./jobs/init.job";
import { JOverrideTierJob } from "./jobs/override-tier.job";

@Injectable()
export class MembershipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly excel: ExcelExportService,
  ) {}

  exportMembership = (
    query: CExportMembershipDto,
  ) => JExportMembershipJob(this.prisma, this.excel, query);

  updateMember = (
    id: string,
    body: CUpdateMemberDto,
  ) => JUpdateMemberJob(this.prisma, id, body);

  deleteMember = (
    id: string,
  ) => JDeleteMemberJob(this.prisma, id);

  getMembershipList = (
    query: CGetMembershipListDto,
  ) => JGetMembershipListJob(this.prisma, query);

  getMembershipDetail = (
    id: string,
  ) => JGetMembershipDetailJob(this.prisma, id);

  createMembership = (
    body: CCreateMembershipDto,
  ) => JCreateMembershipJob(this.prisma, body);

  initMembership = (
    body: CInitMembershipDto,
  ) => JInitMembershipJob(this.prisma, body);

  overrideTier = (
    id: string,
    body: COverrideTierDto,
  ) => JOverrideTierJob(this.prisma, id, body);
}
