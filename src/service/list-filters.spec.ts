import { buildMembershipWhere } from './membership/jobs/list.job';
import { buildPetWhere } from './pet/jobs/list.job';
import { buildPointsHistoryWhere } from './points/jobs/list.job';
import { buildRewardWhere } from './reward/jobs/list.job';
import { buildRedemptionWhere } from './reward/jobs/redemption-list.job';
import { buildMedicalHistoryWhere } from './medical-history/jobs/list.job';
import { buildTierWhere } from './tiers/jobs/list.job';
import { exportPetSchema, listPetSchema } from './pet/dto/list.dto';
import { exportMembershipSchema, listMembershipSchema } from './membership/dto/list.dto';

describe('membership filters', () => {
  it('always hides soft-deleted users', () => {
    expect(buildMembershipWhere({})).toEqual({ users: { AND: [{ deleted_at: null }] } });
  });

  it('applies the points range and join-date range', () => {
    const where = buildMembershipWhere({
      minPoints: 100,
      maxPoints: 500,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });

    expect(where.points).toEqual({ gte: 100, lte: 500 });
    expect(where.created_at).toEqual({
      gte: new Date('2026-01-01'),
      lte: new Date('2026-01-31T23:59:59.999Z'),
    });
  });

  it('supports a one-sided points range', () => {
    expect(buildMembershipWhere({ minPoints: 100 }).points).toEqual({ gte: 100 });
    expect(buildMembershipWhere({ maxPoints: 0 }).points).toEqual({ lte: 0 });
  });

  it('filters by tier and searches name/email/phone when search_by is omitted', () => {
    const where = buildMembershipWhere({ tier_id: 'tier-1', search: 'budi' });

    expect(where.tierId).toBe('tier-1');
    const filters = (where.users as { AND: unknown[] }).AND;
    expect(JSON.stringify(filters[1])).toContain('email');
    expect(JSON.stringify(filters[1])).toContain('phone');
  });
});

describe('pet filters', () => {
  it('defaults to active pets only', () => {
    const where = buildPetWhere({ status: 'ACTIVE' });

    expect(where.AND).toEqual([{ deleted_at: null }, { users: { deleted_at: null } }]);
  });

  it('returns archived pets only for ARCHIVED', () => {
    expect(buildPetWhere({ status: 'ARCHIVED' }).AND).toEqual([
      { deleted_at: { not: null } },
      { users: { deleted_at: null } },
    ]);
  });

  it('does not filter on archive state for ALL, but still hides deleted owners', () => {
    expect(buildPetWhere({ status: 'ALL' }).AND).toEqual([{}, { users: { deleted_at: null } }]);
  });

  it('keeps is_neutered=false as a real filter', () => {
    expect(buildPetWhere({ status: 'ACTIVE', is_neutered: false }).is_neutered).toBe(false);
  });
});

describe('points history filters', () => {
  it('applies the amount range including negative amounts', () => {
    const where = buildPointsHistoryWhere({ minAmount: -500, maxAmount: -1 });

    expect(where.amount).toEqual({ gte: -500, lte: -1 });
  });

  it('searches customer name/phone, reference_id and description by default', () => {
    const text = JSON.stringify(buildPointsHistoryWhere({ search: 'abc' }));

    expect(text).toContain('first_name');
    expect(text).toContain('phone');
    expect(text).toContain('reference_id');
    expect(text).toContain('description');
  });

  it('matches transaction types partially and never throws on unknown terms', () => {
    expect(buildPointsHistoryWhere({ search: 'earn', search_by: 'type' }).AND).toEqual([
      { type: { in: ['EARNED'] } },
    ]);
    expect(buildPointsHistoryWhere({ search: 'zzz', search_by: 'type' }).AND).toEqual([
      { type: { in: [] } },
    ]);
  });
});

describe('coupon and redemption filters', () => {
  it('applies the coupon price range', () => {
    expect(buildRewardWhere({ minCost: 100, maxCost: 300 }).points_cost).toEqual({
      gte: 100,
      lte: 300,
    });
  });

  it('applies the redemption date range and searches customer or coupon title', () => {
    const where = buildRedemptionWhere({
      search: 'grooming',
      startDate: '2026-02-01',
      endDate: '2026-02-28',
    });

    expect(where.created_at).toEqual({
      gte: new Date('2026-02-01'),
      lte: new Date('2026-02-28T23:59:59.999Z'),
    });
    expect(JSON.stringify(where.AND)).toContain('title');
    expect(JSON.stringify(where.AND)).toContain('phone');
  });
});

describe('tier and medical history default search', () => {
  it('returns no filter without a search term', () => {
    expect(buildTierWhere({})).toEqual({});
    expect(buildMedicalHistoryWhere({})).toEqual({});
  });

  it('searches every column when search_by is omitted', () => {
    expect(buildTierWhere({ search: 'gold' })).toEqual({
      OR: [
        { name: { contains: 'gold', mode: 'insensitive' } },
        { description: { contains: 'gold', mode: 'insensitive' } },
      ],
    });
    expect(JSON.stringify(buildMedicalHistoryWhere({ search: 'x' }))).toContain('doctor_name');
  });
});

describe('export schemas', () => {
  it('accept the list filters without pagination', () => {
    const parsed = exportMembershipSchema.parse({ minPoints: '10', tier_id: undefined });

    expect(parsed).not.toHaveProperty('page');
    expect(parsed).not.toHaveProperty('limit');
    expect(parsed.minPoints).toBe(10);
    expect(listMembershipSchema.parse({}).limit).toBe(10);
  });

  it('lets includeDeleted widen the pet status while the list defaults to ACTIVE', () => {
    expect(listPetSchema.parse({}).status).toBe('ACTIVE');
    expect(exportPetSchema.parse({}).status).toBeUndefined();
    expect(exportPetSchema.parse({ includeDeleted: 'true' }).includeDeleted).toBe(true);
  });

  it('rejects a non-numeric range', () => {
    expect(exportMembershipSchema.safeParse({ minPoints: 'abc' }).success).toBe(false);
  });
});
