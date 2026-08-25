import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export class CLoginDto extends createZodDto(loginSchema) {}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}
