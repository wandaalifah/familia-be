import dayjs from 'dayjs';

export const BASIC_VACCINE_DOSES = 3;
export const ROUTINE_DEWORMING_INTERVAL_DAYS = 30;

// Basic series (dose 1..3): next dose in +1 month. After the 3rd dose: yearly booster (+12 months).
export const calculateVaccineNextDueDate = (administeredAt: Date, doseNumber: number): Date =>
  dayjs(administeredAt)
    .add(doseNumber <= BASIC_VACCINE_DOSES ? 1 : 12, 'month')
    .toDate();

export const calculateDewormingNextDueDate = (administeredAt: Date): Date =>
  dayjs(administeredAt).add(ROUTINE_DEWORMING_INTERVAL_DAYS, 'day').toDate();
