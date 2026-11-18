import { PrismaService } from '../../../common/prisma/prisma.service';
import { applyPointsChange, PointsChangeResult } from '../../../common/loyalty/points-ledger';
import { CAdjustPointsDto } from '../dto/adjust.dto';

export const JAdjustPointsJob = async (
  prisma: PrismaService,
  body: CAdjustPointsDto,
): Promise<PointsChangeResult> => {
  try {
    return await prisma.$transaction((tx) =>
      applyPointsChange(tx, {
        membershipId: body.membershipId,
        amount: body.amount,
        type: body.type,
        description: body.description ?? 'Manual points adjustment by admin',
      }),
    );
  } catch (error) {
    console.error('Error in JAdjustPointsJob:', error);
    throw error;
  }
};
