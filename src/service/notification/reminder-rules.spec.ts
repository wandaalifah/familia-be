import { NotificationCategory } from '@prisma/client';
import {
  daysUntil,
  DewormingRecordRow,
  latestVaccineSchedules,
  planDewormingReminders,
  planVaccineReminders,
  startOfReminderDay,
  VaccineRecordRow,
} from './reminder-rules';

// Jakarta is UTC+7; all dates below are given as Jakarta noon to avoid day-boundary ambiguity
const jakarta = (isoDate: string): Date => new Date(`${isoDate}T12:00:00+07:00`);

const vaccine = (overrides: Partial<VaccineRecordRow> = {}): VaccineRecordRow => ({
  petId: 'pet-1',
  petName: 'Mochi',
  userId: 'user-1',
  vaccineName: 'Rabies',
  administeredAt: jakarta('2026-03-01'),
  nextDueDate: jakarta('2026-04-01'),
  ...overrides,
});

const deworming = (overrides: Partial<DewormingRecordRow> = {}): DewormingRecordRow => ({
  petId: 'pet-1',
  petName: 'Mochi',
  userId: 'user-1',
  administeredAt: jakarta('2026-03-01'),
  ...overrides,
});

const categoriesOf = (planned: { category: NotificationCategory }[]) =>
  planned.map((item) => item.category);

describe('daysUntil', () => {
  it('counts whole calendar days in Jakarta time', () => {
    expect(daysUntil(jakarta('2026-04-08'), jakarta('2026-04-01'))).toBe(7);
    expect(daysUntil(jakarta('2026-04-01'), jakarta('2026-04-01'))).toBe(0);
    expect(daysUntil(jakarta('2026-03-30'), jakarta('2026-04-01'))).toBe(-2);
  });
});

describe('planVaccineReminders', () => {
  it('plans the pre-vaccine deworming reminder at H-14', () => {
    const planned = planVaccineReminders([vaccine()], startOfReminderDay(jakarta('2026-03-18')));

    expect(categoriesOf(planned)).toEqual([NotificationCategory.PRE_VACCINE_DEWORMING]);
    expect(planned[0].target_due_date).toEqual(startOfReminderDay(jakarta('2026-04-01')));
  });

  it('plans the vaccine reminder at H-7', () => {
    const planned = planVaccineReminders([vaccine()], startOfReminderDay(jakarta('2026-03-25')));

    expect(categoriesOf(planned)).toEqual([NotificationCategory.VACCINE_REMINDER]);
  });

  it('does not plan anything before H-14', () => {
    const planned = planVaccineReminders([vaccine()], startOfReminderDay(jakarta('2026-03-10')));

    expect(planned).toEqual([]);
  });

  it('stops the pre-vaccine reminder once H-7 is reached (too late to deworm)', () => {
    const planned = planVaccineReminders([vaccine()], startOfReminderDay(jakarta('2026-03-25')));

    expect(categoriesOf(planned)).not.toContain(NotificationCategory.PRE_VACCINE_DEWORMING);
  });

  it('plans nothing after the due date has passed', () => {
    const planned = planVaccineReminders([vaccine()], startOfReminderDay(jakarta('2026-04-02')));

    expect(planned).toEqual([]);
  });

  it('is stable for the same due date across days, so the unique key repeats', () => {
    const first = planVaccineReminders([vaccine()], startOfReminderDay(jakarta('2026-03-26')));
    const second = planVaccineReminders([vaccine()], startOfReminderDay(jakarta('2026-03-29')));

    expect(first[0].target_due_date).toEqual(second[0].target_due_date);
    expect(first[0].category).toBe(second[0].category);
  });

  it('stops reminding for a superseded dose once a newer record exists', () => {
    const oldDose = vaccine();
    const newDose = vaccine({
      administeredAt: jakarta('2026-03-20'),
      nextDueDate: jakarta('2026-04-20'),
    });

    // 25 March would be H-7 for the old dose, but the new dose replaced that schedule
    const planned = planVaccineReminders([oldDose, newDose], startOfReminderDay(jakarta('2026-03-25')));

    expect(planned).toEqual([]);
  });

  it('groups vaccines due on the same day into one notification', () => {
    const planned = planVaccineReminders(
      [vaccine(), vaccine({ vaccineName: 'DHPPi' })],
      startOfReminderDay(jakarta('2026-03-26')),
    );

    expect(planned).toHaveLength(1);
    expect(planned[0].message).toContain('Rabies, DHPPi');
  });

  it('keeps separate schedules per pet', () => {
    const planned = planVaccineReminders(
      [vaccine(), vaccine({ petId: 'pet-2', petName: 'Kiko' })],
      startOfReminderDay(jakarta('2026-03-26')),
    );

    expect(planned.map((item) => item.petId).sort()).toEqual(['pet-1', 'pet-2']);
  });
});

describe('pre-vaccine deworming exception', () => {
  // Vaccine due 2026-04-01; "today" 2026-03-18 is H-14
  const today = startOfReminderDay(jakarta('2026-03-18'));
  const planWith = (administeredAt: string) =>
    planVaccineReminders([vaccine()], today, [deworming({ administeredAt: jakarta(administeredAt) })]);

  it('skips the reminder when deworming was given recently (>= H-7 before the vaccine)', () => {
    expect(planWith('2026-03-15')).toEqual([]);
  });

  it('skips at the boundaries: exactly 7 and exactly 30 days before the vaccine', () => {
    expect(planWith('2026-03-25')).toEqual([]);
    expect(planWith('2026-03-02')).toEqual([]);
  });

  it('still reminds when the last deworming is older than the 30-day interval', () => {
    expect(categoriesOf(planWith('2026-03-01'))).toEqual([
      NotificationCategory.PRE_VACCINE_DEWORMING,
    ]);
  });

  it('still reminds when the deworming would be less than 7 days before the vaccine', () => {
    expect(categoriesOf(planWith('2026-03-27'))).toEqual([
      NotificationCategory.PRE_VACCINE_DEWORMING,
    ]);
  });

  it('ignores deworming records of other pets', () => {
    const planned = planVaccineReminders([vaccine()], today, [
      deworming({ petId: 'pet-2', administeredAt: jakarta('2026-03-15') }),
    ]);

    expect(categoriesOf(planned)).toEqual([NotificationCategory.PRE_VACCINE_DEWORMING]);
  });

  it('does not affect the H-7 vaccine reminder', () => {
    const planned = planVaccineReminders(
      [vaccine()],
      startOfReminderDay(jakarta('2026-03-25')),
      [deworming({ administeredAt: jakarta('2026-03-20') })],
    );

    expect(categoriesOf(planned)).toEqual([NotificationCategory.VACCINE_REMINDER]);
  });
});

describe('latestVaccineSchedules', () => {
  it('keeps the newest record per pet and vaccine, case-insensitively', () => {
    const rows = [
      vaccine({ vaccineName: 'rabies', administeredAt: jakarta('2026-01-01') }),
      vaccine({ vaccineName: 'Rabies', administeredAt: jakarta('2026-02-01') }),
    ];

    expect(latestVaccineSchedules(rows)).toHaveLength(1);
    expect(latestVaccineSchedules(rows)[0].administeredAt).toEqual(jakarta('2026-02-01'));
  });

  it('drops records without a next due date', () => {
    expect(latestVaccineSchedules([vaccine({ nextDueDate: null })])).toEqual([]);
  });
});

describe('planDewormingReminders', () => {
  it('plans the routine reminder 30 days after the last deworming', () => {
    const planned = planDewormingReminders([deworming()], startOfReminderDay(jakarta('2026-03-31')));

    expect(categoriesOf(planned)).toEqual([NotificationCategory.DEWORMING_ROUTINE]);
    expect(planned[0].target_due_date).toEqual(startOfReminderDay(jakarta('2026-03-31')));
  });

  it('plans nothing before day 30', () => {
    const planned = planDewormingReminders([deworming()], startOfReminderDay(jakarta('2026-03-30')));

    expect(planned).toEqual([]);
  });

  it('uses only the latest deworming per pet', () => {
    const planned = planDewormingReminders(
      [deworming(), deworming({ administeredAt: jakarta('2026-03-15') })],
      startOfReminderDay(jakarta('2026-03-31')),
    );

    // The 15 March record moves the due date to 14 April, so nothing is due on 31 March
    expect(planned).toEqual([]);
  });

  it('allows a short catch-up window but not an indefinite backlog', () => {
    const lateByTwoDays = planDewormingReminders(
      [deworming()],
      startOfReminderDay(jakarta('2026-04-02')),
    );
    const lateByTenDays = planDewormingReminders(
      [deworming()],
      startOfReminderDay(jakarta('2026-04-10')),
    );

    expect(lateByTwoDays).toHaveLength(1);
    expect(lateByTenDays).toEqual([]);
  });
});
