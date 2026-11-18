import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { NotificationCategory } from '@prisma/client';
import { ROUTINE_DEWORMING_INTERVAL_DAYS } from '../../common/vaccines/vaccine-schedule';

dayjs.extend(utc);
dayjs.extend(timezone);

export const REMINDER_TIME_ZONE = 'Asia/Jakarta';

// Windows are expressed in whole calendar days until the due date (H-n).
// A window instead of an exact day lets a missed cron run catch up; the unique
// constraint on notification_history still guarantees a single notification per due date.
export const VACCINE_REMINDER_WINDOW = { minDays: 0, maxDays: 7 };
// H-14 reminder; deworming must be given by H-7, so it is pointless from H-7 onward.
export const PRE_VACCINE_DEWORMING_WINDOW = { minDays: 8, maxDays: 14 };
// Due on day +30 after the last deworming; short grace period for a missed run.
export const DEWORMING_ROUTINE_WINDOW = { minDays: -3, maxDays: 0 };
export const PRE_VACCINE_DEADLINE_DAYS = 7;

export interface DayWindow {
  minDays: number;
  maxDays: number;
}

export interface VaccineRecordRow {
  petId: string;
  petName: string;
  userId: string;
  vaccineName: string;
  administeredAt: Date;
  nextDueDate: Date | null;
}

export interface DewormingRecordRow {
  petId: string;
  petName: string;
  userId: string;
  administeredAt: Date;
}

export interface PlannedNotification {
  petId: string;
  userId: string;
  category: NotificationCategory;
  target_due_date: Date;
  title: string;
  message: string;
}

export const startOfReminderDay = (date: Date): Date =>
  dayjs(date).tz(REMINDER_TIME_ZONE).startOf('day').toDate();

export const daysUntil = (target: Date, today: Date): number =>
  dayjs(startOfReminderDay(target)).diff(dayjs(startOfReminderDay(today)), 'day');

const isWithin = (days: number, window: DayWindow): boolean =>
  days >= window.minDays && days <= window.maxDays;

const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat('id-ID', {
    timeZone: REMINDER_TIME_ZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

// Only the newest record of each vaccine per pet defines the live schedule;
// older doses are superseded (this is what stops reminders once a new record is entered).
export const latestVaccineSchedules = (rows: VaccineRecordRow[]): VaccineRecordRow[] => {
  const latest = new Map<string, VaccineRecordRow>();
  for (const row of rows) {
    const key = `${row.petId}::${row.vaccineName.trim().toLowerCase()}`;
    const current = latest.get(key);
    if (!current || row.administeredAt > current.administeredAt) {
      latest.set(key, row);
    }
  }
  return [...latest.values()].filter((row) => row.nextDueDate !== null);
};

interface VaccineGroup {
  petId: string;
  petName: string;
  userId: string;
  targetDueDate: Date;
  vaccineNames: string[];
}

// One notification per pet per due day, listing every vaccine due that day.
const groupByPetAndDueDay = (rows: VaccineRecordRow[]): VaccineGroup[] => {
  const groups = new Map<string, VaccineGroup>();
  for (const row of rows) {
    const targetDueDate = startOfReminderDay(row.nextDueDate as Date);
    const key = `${row.petId}::${targetDueDate.toISOString()}`;
    const group = groups.get(key);
    if (group) {
      group.vaccineNames.push(row.vaccineName);
    } else {
      groups.set(key, {
        petId: row.petId,
        petName: row.petName,
        userId: row.userId,
        targetDueDate,
        vaccineNames: [row.vaccineName],
      });
    }
  }
  return [...groups.values()];
};

// The pre-vaccine requirement is already met when the pet got a deworming at least
// H-7 before the vaccine and still within the routine 30-day interval.
export const hasQualifyingDeworming = (
  petId: string,
  vaccineDueDate: Date,
  dewormings: DewormingRecordRow[],
): boolean =>
  dewormings.some((deworming) => {
    if (deworming.petId !== petId) return false;
    const daysBeforeVaccine = daysUntil(vaccineDueDate, deworming.administeredAt);
    return (
      daysBeforeVaccine >= PRE_VACCINE_DEADLINE_DAYS &&
      daysBeforeVaccine <= ROUTINE_DEWORMING_INTERVAL_DAYS
    );
  });

export const planVaccineReminders = (
  rows: VaccineRecordRow[],
  today: Date,
  dewormings: DewormingRecordRow[] = [],
): PlannedNotification[] => {
  const planned: PlannedNotification[] = [];

  for (const group of groupByPetAndDueDay(latestVaccineSchedules(rows))) {
    const days = daysUntil(group.targetDueDate, today);
    const vaccines = group.vaccineNames.join(', ');
    const dueText = formatDate(group.targetDueDate);
    const base = {
      petId: group.petId,
      userId: group.userId,
      target_due_date: group.targetDueDate,
    };

    if (isWithin(days, VACCINE_REMINDER_WINDOW)) {
      planned.push({
        ...base,
        category: NotificationCategory.VACCINE_REMINDER,
        title: `Jadwal vaksin ${group.petName}`,
        message: `${group.petName} dijadwalkan vaksin ${vaccines} pada ${dueText}.`,
      });
    }

    const needsDewormingReminder =
      isWithin(days, PRE_VACCINE_DEWORMING_WINDOW) &&
      !hasQualifyingDeworming(group.petId, group.targetDueDate, dewormings);

    if (needsDewormingReminder) {
      const deadline = new Date(
        group.targetDueDate.getTime() - PRE_VACCINE_DEADLINE_DAYS * 24 * 60 * 60 * 1000,
      );
      planned.push({
        ...base,
        category: NotificationCategory.PRE_VACCINE_DEWORMING,
        title: `Obat cacing & kutu untuk ${group.petName}`,
        message:
          `${group.petName} dijadwalkan vaksin ${vaccines} pada ${dueText}. ` +
          `Berikan obat cacing & kutu paling lambat ${formatDate(deadline)} (H-${PRE_VACCINE_DEADLINE_DAYS} sebelum vaksin).`,
      });
    }
  }

  return planned;
};

export const planDewormingReminders = (
  rows: DewormingRecordRow[],
  today: Date,
): PlannedNotification[] => {
  // Only the latest deworming per pet counts
  const latestByPet = new Map<string, DewormingRecordRow>();
  for (const row of rows) {
    const current = latestByPet.get(row.petId);
    if (!current || row.administeredAt > current.administeredAt) {
      latestByPet.set(row.petId, row);
    }
  }

  const planned: PlannedNotification[] = [];
  for (const row of latestByPet.values()) {
    const targetDueDate = startOfReminderDay(
      new Date(row.administeredAt.getTime() + ROUTINE_DEWORMING_INTERVAL_DAYS * 24 * 60 * 60 * 1000),
    );

    if (!isWithin(daysUntil(targetDueDate, today), DEWORMING_ROUTINE_WINDOW)) continue;

    planned.push({
      petId: row.petId,
      userId: row.userId,
      category: NotificationCategory.DEWORMING_ROUTINE,
      target_due_date: targetDueDate,
      title: `Waktunya obat cacing ${row.petName}`,
      message:
        `Sudah ${ROUTINE_DEWORMING_INTERVAL_DAYS} hari sejak pemberian obat cacing terakhir ` +
        `${row.petName} (${formatDate(row.administeredAt)}). Jadwalkan pemberian obat cacing berikutnya.`,
    });
  }

  return planned;
};
