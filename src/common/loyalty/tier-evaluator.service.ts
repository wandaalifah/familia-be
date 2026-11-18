import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { evaluateMembershipTier } from './tier-evaluator';

@Injectable()
export class TierEvaluatorService {
  constructor(private readonly prisma: PrismaService) {}

  /** Re-evaluates every membership; returns how many changed tier. */
  async evaluateAll(): Promise<{ evaluated: number; changed: number }> {
    const memberships = await this.prisma.membership.findMany({
      select: { id: true },
    });

    let changed = 0;
    for (const { id } of memberships) {
      const result = await this.prisma.$transaction((tx) =>
        evaluateMembershipTier(tx, id),
      );
      if (result.changed) changed += 1;
    }

    return { evaluated: memberships.length, changed };
  }
}
