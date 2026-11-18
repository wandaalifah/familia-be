import { Global, Module } from '@nestjs/common';
import { TierEvaluatorService } from './tier-evaluator.service';

@Global()
@Module({
  providers: [TierEvaluatorService],
  exports: [TierEvaluatorService],
})
export class LoyaltyModule {}
