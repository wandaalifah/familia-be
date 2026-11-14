import { Prisma } from '@prisma/client';

export type UserPetMedicalHistoryItem = Prisma.medical_historyGetPayload<{}>;

export type UserPetItem = Prisma.petGetPayload<{
  include: {
    medical_history: true;
  };
}>;
