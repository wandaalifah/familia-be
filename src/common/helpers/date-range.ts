import { z } from 'zod';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Plain string (not z.coerce.date / transform) so the schema stays representable
// in JSON Schema for Swagger; conversion to Date happens in buildDateRange.
export const dateQuerySchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date, use ISO 8601');

export interface DateRange {
  gte?: Date;
  lte?: Date;
}

// A date-only endDate (YYYY-MM-DD) is inclusive: it covers the whole day.
export const buildDateRange = (startDate?: string, endDate?: string): DateRange | undefined => {
  if (!startDate && !endDate) return undefined;

  const range: DateRange = {};
  if (startDate) range.gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    if (DATE_ONLY_PATTERN.test(endDate)) end.setUTCHours(23, 59, 59, 999);
    range.lte = end;
  }
  return range;
};
