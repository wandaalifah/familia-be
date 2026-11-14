import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/prisma/prisma.service";
import { CGetPetListDto } from "./dto/list.dto";
import { CCreatePetDto } from "./dto/create.dto";
import { CUpdatePetDto } from "./dto/update.dto";
import { JGetPetListJob } from "./jobs/list.job";
import { JGetPetDetailJob } from "./jobs/detail.job";
import { JCreatePetJob } from "./jobs/create.job";
import { JUpdatePetJob } from "./jobs/update.job";
import { JDeletePetJob } from "./jobs/delete.job";

@Injectable()
export class PetService {
  constructor(private readonly prisma: PrismaService) {}

  getPetList = (
    query: CGetPetListDto,
  ) => JGetPetListJob(this.prisma, query);

  getPetDetail = (
    id: string,
  ) => JGetPetDetailJob(this.prisma, id);

  createPet = (
    body: CCreatePetDto,
  ) => JCreatePetJob(this.prisma, body);

  updatePet = (
    id: string,
    body: CUpdatePetDto,
  ) => JUpdatePetJob(this.prisma, id, body);

  deletePet = (
    id: string,
  ) => JDeletePetJob(this.prisma, id);
}
