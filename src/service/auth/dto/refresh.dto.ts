import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

export class CRefreshDto extends createZodDto(refreshSchema) {}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}
