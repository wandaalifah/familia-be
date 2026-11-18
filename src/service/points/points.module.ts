import { Module } from "@nestjs/common";
import { PointsController } from "./points.controller";
import { PointsService } from "./points.service";
import { PointsScheduler } from "./points.scheduler";

@Module({
  controllers: [PointsController],
  providers: [PointsService, PointsScheduler],
})
export class PointsModule {}