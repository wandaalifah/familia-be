import { PrismaService } from '../../../common/prisma/prisma.service';
import { TierEvaluatorService } from '../../../common/loyalty/tier-evaluator.service';
import { CUpdateTierDto, UpdateTierResponse } from '../dto/update.dto';

export type UpdateTierResult = UpdateTierResponse & {
  resync?: { evaluated: number; changed: number };
};

export const JUpdateTierJob = async (
  prisma: PrismaService,
  tierEvaluator: TierEvaluatorService,
  id: string,
  body: CUpdateTierDto,
): Promise<UpdateTierResult> => {
  try {
    const { resync_members, ...data } = body;

    const tier = await prisma.tiers.update({ where: { id }, data });

    const tierRulesChanged =
      data.required_points !== undefined || data.level !== undefined;

    if (resync_members && tierRulesChanged) {
      const resync = await tierEvaluator.evaluateAll();
      return { ...tier, resync };
    }

    return tier;
  } catch (error) {
    console.error('Error in JUpdateTierJob:', error);
    throw error;
  }
};
