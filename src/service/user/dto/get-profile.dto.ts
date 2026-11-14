import { Prisma } from '@prisma/client';

export type GetProfileResponse = Prisma.usersGetPayload<{
  select: {
    id: true;
    email: true;
    phone: true;
    first_name: true;
    last_name: true;
    role: true;
    avatar: true;
    created_at: true;
    updated_at: true;
  };
}>;
