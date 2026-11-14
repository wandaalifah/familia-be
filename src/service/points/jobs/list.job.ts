import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CGetPointsHistoryListDto, PointsHistoryItem } from '../dto/list.dto';
import { IGlobalPaginationDto } from '../../../common/dto/pagination.dto';

export const JGetPointsHistoryListJob = async (
  prisma: PrismaService,
  query: CGetPointsHistoryListDto,
): Promise<{ data: PointsHistoryItem[]; pagination: IGlobalPaginationDto }> => {
  try {
    const { page, limit, sort_by, sort_order, search_by, search, type, membershipId } = query;

    const where: Prisma.points_historyWhereInput = {};

    // Filter by type
    if (type) {
      where.type = type;
    }

    // Filter by membershipId
    if (membershipId) {
      where.membershipId = membershipId;
    }

    // Generic search_by + search
    if (search && search_by) {
      switch (search_by) {
        case 'description':
          where.description = { contains: search, mode: 'insensitive' };
          break;
        case 'type':
          where.type = { equals: search.toUpperCase() as any };
          break;
      }
    }

    // Build orderBy
    const orderBy: Prisma.points_historyOrderByWithRelationInput = (() => {
      switch (sort_by) {
        default:
          return { [sort_by]: sort_order };
      }
    })();

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.points_history.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          membership: {
            select: {
              id: true,
              userId: true,
              users: {
                select: {
                  id: true,
                  email: true,
                  phone: true,
                  first_name: true,
                  last_name: true,
                },
              },
            },
          },
        },
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
    console.error('Error in JGetPointsHistoryListJob:', error);
    throw error;
  }
};
