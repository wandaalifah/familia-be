import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/prisma/prisma.service";
import { CGetMembershipListDto } from "./dto/list.dto";
import { CCreateMembershipDto } from "./dto/create.dto";
import { JGetMembershipListJob } from "./jobs/list.job";
import { JCreateMembershipJob } from "./jobs/create.job";

@Injectable()
export class MembershipService {
  constructor(private readonly prisma: PrismaService) {}

  getMembershipList = (
    query: CGetMembershipListDto,
  ) => JGetMembershipListJob(this.prisma, query);

  createMembership = (
    body: CCreateMembershipDto,
  ) => JCreateMembershipJob(this.prisma, body);
}