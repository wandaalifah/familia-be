import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './service/auth/auth.module';
import { MembershipModule } from './service/membership/membership.module';
import { PointsModule } from './service/points/points.module';
import { RewardModule } from './service/reward/reward.module';
import { TiersModule } from './service/tiers/tiers.module';
import { PetModule } from './service/pet/pet.module';
import { MedicalHistoryModule } from './service/medical-history/medical-history.module';
import { UserModule } from './service/user/user.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000, // 1 minute
        limit: 10, // default 10 requests per minute
      },
    ]),
    PrismaModule,
    AuthModule,
    MembershipModule,
    PointsModule,
    RewardModule,
    TiersModule,
    PetModule,
    MedicalHistoryModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
