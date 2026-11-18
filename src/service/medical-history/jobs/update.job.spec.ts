import { MedicalRecordType } from '@prisma/client';
import { JUpdateMedicalHistoryJob } from './update.job';

const existing = (overrides: Record<string, unknown>) => ({
  id: 'mh-1',
  petId: 'pet-1',
  type: MedicalRecordType.VACCINE,
  vaccine_name: 'Rabies',
  dose_number: 1,
  administered_at: new Date('2026-01-01T00:00:00Z'),
  next_due_date: new Date('2026-02-01T00:00:00Z'),
  discharged_at: null,
  ...overrides,
});

const buildPrisma = (record: ReturnType<typeof existing>) => {
  const update = jest.fn().mockResolvedValue(record);
  const prisma = {
    medical_history: { findUnique: jest.fn().mockResolvedValue(record), update, count: jest.fn() },
    pet: { findFirst: jest.fn().mockResolvedValue({ species: 'Anjing' }) },
  };
  return { prisma: prisma as never, update };
};

describe('JUpdateMedicalHistoryJob next_due_date', () => {
  it('ignores a client next_due_date for VACCINE records', async () => {
    const { prisma, update } = buildPrisma(existing({}));

    await JUpdateMedicalHistoryJob(prisma, 'mh-1', { next_due_date: '2030-01-01T00:00:00.000Z' });

    expect(update.mock.calls[0][0].data.next_due_date).toEqual(new Date('2026-02-01T00:00:00Z'));
  });

  it('drops the stale auto-derived date when the type leaves VACCINE', async () => {
    const { prisma, update } = buildPrisma(existing({}));

    await JUpdateMedicalHistoryJob(prisma, 'mh-1', { type: MedicalRecordType.GROOMING });

    expect(update.mock.calls[0][0].data.next_due_date).toBeNull();
  });

  it('clears discharged_at when null is sent for RAWAT_INAP', async () => {
    const { prisma, update } = buildPrisma(
      existing({
        type: MedicalRecordType.RAWAT_INAP,
        vaccine_name: null,
        dose_number: null,
        discharged_at: new Date(),
      }),
    );

    await JUpdateMedicalHistoryJob(prisma, 'mh-1', { discharged_at: null });

    expect(update.mock.calls[0][0].data.discharged_at).toBeNull();
  });

  it('rejects a discharged_at earlier than the stored administered_at', async () => {
    const { prisma } = buildPrisma(
      existing({ type: MedicalRecordType.RAWAT_INAP, vaccine_name: null, dose_number: null }),
    );

    await expect(
      JUpdateMedicalHistoryJob(prisma, 'mh-1', { discharged_at: '2025-12-31T00:00:00.000Z' }),
    ).rejects.toThrow('discharged_at must not be earlier than administered_at');
  });

  it('rejects moving administered_at after the stored discharged_at', async () => {
    const { prisma } = buildPrisma(
      existing({
        type: MedicalRecordType.RAWAT_INAP,
        vaccine_name: null,
        dose_number: null,
        discharged_at: new Date('2026-01-05T00:00:00Z'),
      }),
    );

    await expect(
      JUpdateMedicalHistoryJob(prisma, 'mh-1', { administered_at: '2026-01-10T00:00:00.000Z' }),
    ).rejects.toThrow('discharged_at must not be earlier');
  });
});
