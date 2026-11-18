import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { JDeleteMemberJob } from './membership/jobs/delete.job';
import { JUpdateMemberJob } from './membership/jobs/update.job';
import { updateMemberSchema } from './membership/dto/update.dto';
import { JRestorePetJob } from './pet/jobs/restore.job';

const asPrisma = (mock: unknown) => mock as PrismaService;

describe('JRestorePetJob', () => {
  const archivedPet = {
    id: 'pet-1',
    name: 'Mochi',
    deleted_at: new Date('2026-01-01'),
    users: { deleted_at: null },
  };

  const buildPrisma = (pet: unknown) => {
    const update = jest.fn(async () => ({ id: 'pet-1', deleted_at: null }));
    return { prisma: asPrisma({ pet: { findUnique: jest.fn(async () => pet), update } }), update };
  };

  it('clears deleted_at for an archived pet with an active owner', async () => {
    const { prisma, update } = buildPrisma(archivedPet);

    const restored = await JRestorePetJob(prisma, 'pet-1');

    expect(update).toHaveBeenCalledWith({ where: { id: 'pet-1' }, data: { deleted_at: null } });
    expect(restored.deleted_at).toBeNull();
  });

  it('returns 404 when the pet does not exist', async () => {
    const { prisma } = buildPrisma(null);

    await expect(JRestorePetJob(prisma, 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 400 when the pet is not archived', async () => {
    const { prisma, update } = buildPrisma({ ...archivedPet, deleted_at: null });

    await expect(JRestorePetJob(prisma, 'pet-1')).rejects.toBeInstanceOf(BadRequestException);
    expect(update).not.toHaveBeenCalled();
  });

  it('returns 400 when the owner has been deleted', async () => {
    const { prisma, update } = buildPrisma({
      ...archivedPet,
      users: { deleted_at: new Date('2026-02-01') },
    });

    await expect(JRestorePetJob(prisma, 'pet-1')).rejects.toBeInstanceOf(BadRequestException);
    expect(update).not.toHaveBeenCalled();
  });
});

describe('JDeleteMemberJob', () => {
  it('soft-deletes the user and revokes the refresh token', async () => {
    const userUpdate = jest.fn(async () => ({}));
    const prisma = asPrisma({
      membership: { findFirst: jest.fn(async () => ({ userId: 'user-1' })) },
      users: { update: userUpdate },
    });

    const result = await JDeleteMemberJob(prisma, 'mem-1');

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { deleted_at: expect.any(Date), hashed_refresh_token: null },
    });
    expect(result).toMatchObject({ id: 'mem-1', userId: 'user-1' });
  });

  it('returns 404 for an unknown or already deleted member', async () => {
    const prisma = asPrisma({ membership: { findFirst: jest.fn(async () => null) } });

    await expect(JDeleteMemberJob(prisma, 'mem-1')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('JUpdateMemberJob', () => {
  it('updates the member user and returns the refreshed membership', async () => {
    const userUpdate = jest.fn(async () => ({}));
    const membership = { id: 'mem-1', points: 650 };
    const prisma = asPrisma({
      membership: {
        findFirst: jest.fn(async () => ({ userId: 'user-1' })),
        findUniqueOrThrow: jest.fn(async () => membership),
      },
      users: { update: userUpdate },
    });

    const result = await JUpdateMemberJob(prisma, 'mem-1', { first_name: 'Budi' });

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { first_name: 'Budi' },
    });
    expect(result).toBe(membership);
  });

  it('returns 404 when the member is missing', async () => {
    const prisma = asPrisma({ membership: { findFirst: jest.fn(async () => null) } });

    await expect(JUpdateMemberJob(prisma, 'mem-1', { first_name: 'Budi' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('updateMemberSchema', () => {
  it('accepts a partial update', () => {
    expect(updateMemberSchema.safeParse({ phone: '+6281234567890' }).success).toBe(true);
  });

  it('rejects an empty body, a bad email and a short phone', () => {
    expect(updateMemberSchema.safeParse({}).success).toBe(false);
    expect(updateMemberSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
    expect(updateMemberSchema.safeParse({ phone: '123' }).success).toBe(false);
  });
});
