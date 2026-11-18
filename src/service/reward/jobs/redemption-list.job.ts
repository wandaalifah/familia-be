import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { IGlobalPaginationDto } from '../../../common/dto/pagination.dto';
import { buildPagination } from '../../../common/helpers/pagination';
import { buildDateRange } from '../../../common/helpers/date-range';
import { containsInsensitive } from '../../../common/helpers/filters';
import { CGetRedemptionListDto, RedemptionItem } from '../dto/redeem.dto';

export const REDEMPTION_INCLUDE = {
  users: {
    select: { id: true, email: true, phone: true, first_name: true, last_name: true },
  },
  coupon: { select: { id: true, title: true, points_cost: true } },
} satisfies Prisma.redemption_historyInclude;

type RedemptionFilterQuery = Pick<
  CGetRedemptionListDto,
  'userId' | 'couponId' | 'search' | 'startDate' | 'endDate'
>;

const searchFilter = (term: string): Prisma.redemption_historyWhereInput => {
  const contains = containsInsensitive(term);
  return {
    OR: [
      { users: { OR: [{ first_name: contains }, { last_name: contains }, { phone: contains }] } },
      { coupon: { title: contains } },
    ],
  };
};

// Shared by the list and the export
export const buildRedemptionWhere = (
  query: RedemptionFilterQuery,
): Prisma.redemption_historyWhereInput => {
  const createdAt = buildDateRange(query.startDate, query.endDate);

  return {
    ...(query.userId ? { userId: query.userId } : {}),
    ...(query.couponId ? { couponId: query.couponId } : {}),
    ...(createdAt ? { created_at: createdAt } : {}),
    ...(query.search ? { AND: [searchFilter(query.search)] } : {}),
  };
};

export const JGetRedemptionListJob = async (
  prisma: PrismaService,
  query: CGetRedemptionListDto,
): Promise<{ data: RedemptionItem[]; pagination: IGlobalPaginationDto }> => {
  try {
    const { page, limit, sort_by, sort_order } = query;
    const where = buildRedemptionWhere(query);

    const [data, total] = await Promise.all([
      prisma.redemption_history.findMany({
        where,
        orderBy: { [sort_by]: sort_order },
        skip: (page - 1) * limit,
        take: limit,
        include: REDEMPTION_INCLUDE,
      }),
      prisma.redemption_history.count({ where }),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  } catch (error) {
    console.error('Error in JGetRedemptionListJob:', error);
    throw error;
  }
};
