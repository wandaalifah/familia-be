import { PointTransactionType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CGetPointsHistoryListDto, PointsHistoryItem } from '../dto/list.dto';
import { IGlobalPaginationDto } from '../../../common/dto/pagination.dto';
import { buildPagination } from '../../../common/helpers/pagination';
import { buildDateRange } from '../../../common/helpers/date-range';
import { buildNumberRange, containsInsensitive } from '../../../common/helpers/filters';

export const POINTS_HISTORY_INCLUDE = {
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
} satisfies Prisma.points_historyInclude;

type PointsFilterQuery = Pick<
  CGetPointsHistoryListDto,
  | 'search'
  | 'search_by'
  | 'type'
  | 'membershipId'
  | 'minAmount'
  | 'maxAmount'
  | 'startDate'
  | 'endDate'
>;

const customerFilter = (term: string): Prisma.points_historyWhereInput => {
  const contains = containsInsensitive(term);
  return {
    membership: {
      users: { OR: [{ first_name: contains }, { last_name: contains }, { phone: contains }] },
    },
  };
};

// Partial, case-insensitive match against the transaction type names (e.g. "earn")
const typeFilter = (term: string): Prisma.points_historyWhereInput => ({
  type: {
    in: Object.values(PointTransactionType).filter((type) => type.includes(term.toUpperCase())),
  },
});

const searchFilter = (
  term: string,
  searchBy: PointsFilterQuery['search_by'],
): Prisma.points_historyWhereInput => {
  const contains = containsInsensitive(term);
  if (searchBy === 'description') return { description: contains };
  if (searchBy === 'reference_id') return { reference_id: contains };
  if (searchBy === 'type') return typeFilter(term);
  if (searchBy === 'customer') return customerFilter(term);
  return {
    OR: [customerFilter(term), { reference_id: contains }, { description: contains }],
  };
};

// Shared by the list and the export
export const buildPointsHistoryWhere = (
  query: PointsFilterQuery,
): Prisma.points_historyWhereInput => {
  const amount = buildNumberRange(query.minAmount, query.maxAmount);
  const createdAt = buildDateRange(query.startDate, query.endDate);

  return {
    ...(query.type ? { type: query.type } : {}),
    ...(query.membershipId ? { membershipId: query.membershipId } : {}),
    ...(amount ? { amount } : {}),
    ...(createdAt ? { created_at: createdAt } : {}),
    ...(query.search ? { AND: [searchFilter(query.search, query.search_by)] } : {}),
  };
};

export const JGetPointsHistoryListJob = async (
  prisma: PrismaService,
  query: CGetPointsHistoryListDto,
): Promise<{ data: PointsHistoryItem[]; pagination: IGlobalPaginationDto }> => {
  try {
    const { page, limit, sort_by, sort_order } = query;
    const where = buildPointsHistoryWhere(query);

    const [data, total] = await Promise.all([
      prisma.points_history.findMany({
        where,
        orderBy: { [sort_by]: sort_order },
        skip: (page - 1) * limit,
        take: limit,
        include: POINTS_HISTORY_INCLUDE,
      }),
      prisma.points_history.count({ where }),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  } catch (error) {
    console.error('Error in JGetPointsHistoryListJob:', error);
    throw error;
  }
};
