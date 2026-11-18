import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { LoyaltyModule } from './common/loyalty/loyalty.module';
import { ExcelExportModule } from './common/services/excel-export.module';
import { AuthModule } from './service/auth/auth.module';
import { MembershipModule } from './service/membership/membership.module';
import { PointsModule } from './service/points/points.module';
import { RewardModule } from './service/reward/reward.module';
import { TiersModule } from './service/tiers/tiers.module';
import { PetModule } from './service/pet/pet.module';
import { MedicalHistoryModule } from './service/medical-history/medical-history.module';
import { UserModule } from './service/user/user.module';
import { NotificationModule } from './service/notification/notification.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000, // 1 minute
        limit: 120, // default per IP for every route; /auth routes override with @Throttle
      },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    LoyaltyModule,
    ExcelExportModule,
    AuthModule,
    MembershipModule,
    PointsModule,
    RewardModule,
    TiersModule,
    PetModule,
    MedicalHistoryModule,
    UserModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
