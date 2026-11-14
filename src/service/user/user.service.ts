import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/prisma/prisma.service";
import { CUpdateProfileDto } from "./dto/update-profile.dto";
import { JUpdateProfileJob } from "./jobs/update-profile.job";
import { JGetProfileJob } from "./jobs/get-profile.job";
import { JGetUserPetsJob } from "./jobs/get-pets.job";
import { JGetUserPointsHistoryJob } from "./jobs/get-points-history.job";
import { CGetUserPointsHistoryDto } from "./dto/get-points-history.dto";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  getProfile = (userId: string) => JGetProfileJob(this.prisma, userId);

  getUserPets = (userId: string) => JGetUserPetsJob(this.prisma, userId);

  getUserPointsHistory = (
    userId: string,
    query: CGetUserPointsHistoryDto,
  ) => JGetUserPointsHistoryJob(this.prisma, userId, query);

  updateProfile = (
    userId: string,
    body: CUpdateProfileDto,
  ) => JUpdateProfileJob(this.prisma, userId, body);
}
