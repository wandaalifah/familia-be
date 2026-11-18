import { z } from 'zod';

export const containsInsensitive = (value: string) => ({
  contains: value,
  mode: 'insensitive' as const,
});

// { gte, lte } for whichever bounds are given; undefined when neither is.
export const buildNumberRange = (
  min?: number,
  max?: number,
): { gte?: number; lte?: number } | undefined => {
  if (min === undefined && max === undefined) return undefined;
  return {
    ...(min === undefined ? {} : { gte: min }),
    ...(max === undefined ? {} : { lte: max }),
  };
};

// Query strings arrive as text, so parse 'true' / 'false' explicitly
export const booleanQuerySchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

export const rangeNumberQuerySchema = z.coerce.number().int().optional();
