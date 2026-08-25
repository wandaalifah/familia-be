import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './service/auth/auth.module';
import { MembershipModule } from './service/membership/membership.module';
import { PointsModule } from './service/points/points.module';
import { RewardModule } from './service/reward/reward.module';
import { TiersModule } from './service/tiers/tiers.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MembershipModule,
    PointsModule,
    RewardModule,
    TiersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
