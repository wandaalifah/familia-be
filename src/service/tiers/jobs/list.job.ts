import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CGetTiersListDto, TierItem } from '../dto/list.dto';
import { IGlobalPaginationDto } from '../../../common/dto/pagination.dto';
import { buildPagination } from '../../../common/helpers/pagination';
import { containsInsensitive } from '../../../common/helpers/filters';

export const TIER_LIST_INCLUDE = {
  _count: { select: { memberships: true } },
} satisfies Prisma.tiersInclude;

// Without search_by, the term is matched against every searchable column.
export const buildTierWhere = (
  query: Pick<CGetTiersListDto, 'search' | 'search_by'>,
): Prisma.tiersWhereInput => {
  const { search, search_by } = query;
  if (!search) return {};

  const contains = containsInsensitive(search);
  if (search_by === 'name') return { name: contains };
  if (search_by === 'description') return { description: contains };
  return { OR: [{ name: contains }, { description: contains }] };
};

export const JGetTiersListJob = async (
  prisma: PrismaService,
  query: CGetTiersListDto,
): Promise<{ data: TierItem[]; pagination: IGlobalPaginationDto }> => {
  try {
    const { page, limit, sort_by, sort_order } = query;
    const where = buildTierWhere(query);

    const [data, total] = await Promise.all([
      prisma.tiers.findMany({
        where,
        orderBy: { [sort_by]: sort_order },
        skip: (page - 1) * limit,
        take: limit,
        include: TIER_LIST_INCLUDE,
      }),
      prisma.tiers.count({ where }),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  } catch (error) {
    console.error('Error in JGetTiersListJob:', error);
    throw error;
  }
};
