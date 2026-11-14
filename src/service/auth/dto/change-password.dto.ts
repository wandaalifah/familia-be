import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { passwordSchema } from '../../../common/dto/password.dto';

export const changePasswordSchema = z.object({
  old_password: z.string().min(1, 'Old password is required'),
  new_password: passwordSchema,
});

export class CChangePasswordDto extends createZodDto(changePasswordSchema) {}

export type ChangePasswordResponse = { message: string };
