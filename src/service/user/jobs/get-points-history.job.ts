import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  CGetUserPointsHistoryDto,
  UserPointsHistoryItem,
} from '../dto/get-points-history.dto';
import { IGlobalPaginationDto } from '../../../common/dto/pagination.dto';

export const JGetUserPointsHistoryJob = async (
  prisma: PrismaService,
  userId: string,
  query: CGetUserPointsHistoryDto,
): Promise<{ data: UserPointsHistoryItem[]; pagination: IGlobalPaginationDto }> => {
  try {
    const { page, limit, sort_by, sort_order, type } = query;

    // Scope to the authenticated user's membership
    const where: Prisma.points_historyWhereInput = {
      membership: { userId },
    };

    // Filter by transaction type
    if (type) {
      where.type = type;
    }

    // Build orderBy
    const orderBy: Prisma.points_historyOrderByWithRelationInput = {
      [sort_by]: sort_order,
    };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.points_history.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.points_history.count({ where }),
    ]);

    const total_pages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        current_page: page,
        total_page: total_pages,
        total_data: total,
        next: page < total_pages ? `?page=${page + 1}&limit=${limit}` : null,
        prev: page > 1 ? `?page=${page - 1}&limit=${limit}` : null,
      },
    };
  } catch (error) {
    console.error('Error in JGetUserPointsHistoryJob:', error);
    throw error;
  }
};
