import { MedicalRecordType } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  DewormingRecordRow,
  PlannedNotification,
  planDewormingReminders,
  planVaccineReminders,
  startOfReminderDay,
  VaccineRecordRow,
} from '../reminder-rules';

const DAY_MS = 24 * 60 * 60 * 1000;
// Furthest look-ahead: the H-14 pre-vaccine reminder (+1 day for end-of-day inclusion)
const VACCINE_LOOKAHEAD_DAYS = 15;
// Deworming records older than this can no longer be due (30 days + grace)
const DEWORMING_LOOKBACK_DAYS = 35;

const activePetFilter = { deleted_at: null, users: { deleted_at: null } };

export interface RunRemindersResult {
  planned: number;
  created: number;
}

const loadVaccineRows = async (prisma: PrismaService, today: Date): Promise<VaccineRecordRow[]> => {
  const candidates = await prisma.medical_history.findMany({
    where: {
      type: MedicalRecordType.VACCINE,
      next_due_date: {
        gte: today,
        lte: new Date(today.getTime() + VACCINE_LOOKAHEAD_DAYS * DAY_MS),
      },
      pet: activePetFilter,
    },
    select: { petId: true },
    distinct: ['petId'],
  });
  if (candidates.length === 0) return [];

  // Full vaccine history of those pets, so superseded doses can be detected
  const records = await prisma.medical_history.findMany({
    where: {
      type: MedicalRecordType.VACCINE,
      petId: { in: candidates.map((candidate) => candidate.petId) },
      vaccine_name: { not: null },
    },
    select: {
      petId: true,
      vaccine_name: true,
      administered_at: true,
      next_due_date: true,
      pet: { select: { name: true, userId: true } },
    },
  });

  return records.map((record) => ({
    petId: record.petId,
    petName: record.pet.name,
    userId: record.pet.userId,
    vaccineName: record.vaccine_name as string,
    administeredAt: record.administered_at,
    nextDueDate: record.next_due_date,
  }));
};

const loadDewormingRows = async (
  prisma: PrismaService,
  now: Date,
): Promise<DewormingRecordRow[]> => {
  const records = await prisma.medical_history.findMany({
    where: {
      type: MedicalRecordType.DEWORMING,
      administered_at: { gte: new Date(now.getTime() - DEWORMING_LOOKBACK_DAYS * DAY_MS), lte: now },
      pet: activePetFilter,
    },
    select: {
      petId: true,
      administered_at: true,
      pet: { select: { name: true, userId: true } },
    },
  });

  return records.map((record) => ({
    petId: record.petId,
    petName: record.pet.name,
    userId: record.pet.userId,
    administeredAt: record.administered_at,
  }));
};

// Daily job: plans reminders and stores each at most once per (pet, category, due date).
// skipDuplicates relies on the unique constraint, so re-runs and concurrent instances are safe.
export const JRunRemindersJob = async (
  prisma: PrismaService,
  now: Date = new Date(),
): Promise<RunRemindersResult> => {
  try {
    const today = startOfReminderDay(now);

    const [vaccineRows, dewormingRows] = await Promise.all([
      loadVaccineRows(prisma, today),
      loadDewormingRows(prisma, now),
    ]);

    const planned: PlannedNotification[] = [
      ...planVaccineReminders(vaccineRows, today, dewormingRows),
      ...planDewormingReminders(dewormingRows, today),
    ];
    if (planned.length === 0) return { planned: 0, created: 0 };

    const { count } = await prisma.notification_history.createMany({
      data: planned,
      skipDuplicates: true,
    });

    return { planned: planned.length, created: count };
  } catch (error) {
    console.error('Error in JRunRemindersJob:', error);
    throw error;
  }
};
