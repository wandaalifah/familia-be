import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CGetUpcomingDuesDto, MedicalHistoryWithPet } from '../dto/list.dto';
import { IGlobalPaginationDto } from '../../../common/dto/pagination.dto';
import { buildPagination } from '../../../common/helpers/pagination';
import { PET_WITH_OWNER_INCLUDE } from './list.job';

// Records whose next_due_date falls within the next `days` days, soonest first.
export const JGetUpcomingDuesJob = async (
  prisma: PrismaService,
  query: CGetUpcomingDuesDto,
): Promise<{ data: MedicalHistoryWithPet[]; pagination: IGlobalPaginationDto }> => {
  try {
    const { page, limit, days, type } = query;

    const now = new Date();
    const where: Prisma.medical_historyWhereInput = {
      next_due_date: { gte: now, lte: dayjs(now).add(days, 'day').toDate() },
      pet: { deleted_at: null },
      ...(type ? { type } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.medical_history.findMany({
        where,
        orderBy: { next_due_date: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: PET_WITH_OWNER_INCLUDE,
      }),
      prisma.medical_history.count({ where }),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  } catch (error) {
    console.error('Error in JGetUpcomingDuesJob:', error);
    throw error;
  }
};
