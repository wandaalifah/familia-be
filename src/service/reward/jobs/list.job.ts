import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CGetRewardListDto, RewardItem } from '../dto/list.dto';
import { IGlobalPaginationDto } from '../../../common/dto/pagination.dto';

export const JGetRewardListJob = async (
  prisma: PrismaService,
  query: CGetRewardListDto,
): Promise<{ data: RewardItem[]; pagination: IGlobalPaginationDto }> => {
  try {
    const { page = 1, limit = 10, sort_by, sort_order, search_by, search } = query;

    const where: Prisma.couponWhereInput = {};

    // Generic search_by + search
    if (search && search_by) {
      switch (search_by) {
        case 'title':
          where.title = { contains: search, mode: 'insensitive' };
          break;
        case 'description':
          where.description = { contains: search, mode: 'insensitive' };
          break;
      }
    }

    // Build orderBy
    const orderBy: Prisma.couponOrderByWithRelationInput = (() => {
      switch (sort_by) {
        default:
          return { [sort_by]: sort_order };
      }
    })();

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.coupon.count({ where }),
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
    console.error('Error in JGetRewardListJob:', error);
    throw error;
  }
};
