import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PointTransactionType, Prisma } from '@prisma/client';
import { applyPointsChange } from './points-ledger';

interface MembershipState {
  points: number;
  seasonal_points: number;
  tierId: string | null;
}

const TIERS = [
  { id: 'bronze', level: 1, required_points: 0 },
  { id: 'silver', level: 2, required_points: 100 },
  { id: 'gold', level: 3, required_points: 500 },
];

// Minimal in-memory stand-in for the Prisma transaction client
const createTx = (initial: MembershipState | null) => {
  const state = initial ? { ...initial } : null;
  const ledger: unknown[] = [];
  const tierHistory: unknown[] = [];

  const tx = {
    membership: {
      findUnique: jest.fn(async () => (state ? { id: 'm1' } : null)),
      findUniqueOrThrow: jest.fn(async () => ({
        tierId: state!.tierId,
        seasonal_points: state!.seasonal_points,
        tiers: TIERS.find((t) => t.id === state!.tierId) ?? null,
      })),
      update: jest.fn(async ({ data }: { data: Record<string, any> }) => {
        if (data.points) state!.points += data.points.increment;
        if (data.seasonal_points) state!.seasonal_points += data.seasonal_points.increment;
        if (data.tierId) state!.tierId = data.tierId;
        return { points: state!.points, seasonal_points: state!.seasonal_points };
      }),
    },
    tiers: {
      findFirst: jest.fn(async () => {
        const qualified = TIERS.filter((t) => t.required_points <= state!.seasonal_points);
        return qualified.sort((a, b) => b.level - a.level)[0] ?? null;
      }),
    },
    points_history: {
      create: jest.fn(async ({ data }: { data: unknown }) => {
        ledger.push(data);
        return data;
      }),
    },
    membership_tier_history: {
      create: jest.fn(async ({ data }: { data: unknown }) => {
        tierHistory.push(data);
        return data;
      }),
    },
  };

  return { tx: tx as unknown as Prisma.TransactionClient, state, ledger, tierHistory };
};

describe('applyPointsChange', () => {
  it('adds points and seasonal points, writes ledger and promotes tier', async () => {
    const { tx, state, ledger, tierHistory } = createTx({
      points: 50,
      seasonal_points: 50,
      tierId: 'bronze',
    });

    const result = await applyPointsChange(tx, {
      membershipId: 'm1',
      amount: 60,
      type: PointTransactionType.EARNED,
    });

    expect(state).toMatchObject({ points: 110, seasonal_points: 110, tierId: 'silver' });
    expect(ledger).toHaveLength(1);
    expect(tierHistory).toEqual([
      { membershipId: 'm1', oldTierId: 'bronze', newTierId: 'silver' },
    ]);
    expect(result.tier.changed).toBe(true);
  });

  it('deducts points without touching seasonal points', async () => {
    const { tx, state } = createTx({ points: 200, seasonal_points: 200, tierId: 'silver' });

    await applyPointsChange(tx, {
      membershipId: 'm1',
      amount: -80,
      type: PointTransactionType.REDEEMED,
    });

    expect(state).toMatchObject({ points: 120, seasonal_points: 200, tierId: 'silver' });
  });

  it('throws when the balance would become negative', async () => {
    const { tx, ledger } = createTx({ points: 10, seasonal_points: 10, tierId: 'bronze' });

    await expect(
      applyPointsChange(tx, {
        membershipId: 'm1',
        amount: -11,
        type: PointTransactionType.ADJUSTMENT,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    // The transaction rolls back in production; no ledger row may be written first
    expect(ledger).toHaveLength(0);
  });

  it('throws when the membership does not exist', async () => {
    const { tx } = createTx(null);

    await expect(
      applyPointsChange(tx, {
        membershipId: 'missing',
        amount: 5,
        type: PointTransactionType.EARNED,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a zero amount', async () => {
    const { tx } = createTx({ points: 0, seasonal_points: 0, tierId: 'bronze' });

    await expect(
      applyPointsChange(tx, {
        membershipId: 'm1',
        amount: 0,
        type: PointTransactionType.ADJUSTMENT,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('never demotes: a member with fewer seasonal points than their tier keeps it', async () => {
    // e.g. right after the year-end reset: gold member, seasonal_points back to 0
    const { tx, state, tierHistory } = createTx({
      points: 900,
      seasonal_points: 0,
      tierId: 'gold',
    });

    const result = await applyPointsChange(tx, {
      membershipId: 'm1',
      amount: 5,
      type: PointTransactionType.EARNED,
    });

    expect(state?.tierId).toBe('gold');
    expect(result.tier.changed).toBe(false);
    expect(tierHistory).toHaveLength(0);
  });

  it('keeps the tier and records no history when it is unchanged', async () => {
    const { tx, tierHistory } = createTx({ points: 0, seasonal_points: 0, tierId: 'bronze' });

    const result = await applyPointsChange(tx, {
      membershipId: 'm1',
      amount: 10,
      type: PointTransactionType.EARNED,
    });

    expect(result.tier.changed).toBe(false);
    expect(tierHistory).toHaveLength(0);
  });
});
