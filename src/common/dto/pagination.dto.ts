import z from 'zod';

export interface IGlobalPaginationDto {
  current_page: number | null;
  total_page: number | null;
  total_data: number | null;
  next: string | null;
  prev: string | null;
}

export const globalPaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
