import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CGetRewardListDto, RewardItem } from '../dto/list.dto';
import { IGlobalPaginationDto } from '../../../common/dto/pagination.dto';
import { buildPagination } from '../../../common/helpers/pagination';
import { buildNumberRange, containsInsensitive } from '../../../common/helpers/filters';

export const REWARD_LIST_INCLUDE = {
  _count: { select: { redemptions: true } },
} satisfies Prisma.couponInclude;

const searchFilter = (
  term: string,
  searchBy: CGetRewardListDto['search_by'],
): Prisma.couponWhereInput => {
  const contains = containsInsensitive(term);
  if (searchBy === 'title') return { title: contains };
  if (searchBy === 'description') return { description: contains };
  return { OR: [{ title: contains }, { description: contains }] };
};

// Shared by the list and the export
export const buildRewardWhere = (
  query: Pick<CGetRewardListDto, 'search' | 'search_by' | 'minCost' | 'maxCost'>,
): Prisma.couponWhereInput => {
  const pointsCost = buildNumberRange(query.minCost, query.maxCost);

  return {
    ...(pointsCost ? { points_cost: pointsCost } : {}),
    ...(query.search ? { AND: [searchFilter(query.search, query.search_by)] } : {}),
  };
};

export const JGetRewardListJob = async (
  prisma: PrismaService,
  query: CGetRewardListDto,
): Promise<{ data: RewardItem[]; pagination: IGlobalPaginationDto }> => {
  try {
    const { page, limit, sort_by, sort_order } = query;
    const where = buildRewardWhere(query);

    const [data, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { [sort_by]: sort_order },
        skip: (page - 1) * limit,
        take: limit,
        include: REWARD_LIST_INCLUDE,
      }),
      prisma.coupon.count({ where }),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  } catch (error) {
    console.error('Error in JGetRewardListJob:', error);
    throw error;
  }
};
