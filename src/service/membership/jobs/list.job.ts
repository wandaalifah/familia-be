import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CGetMembershipListDto, MembershipItem } from '../dto/list.dto';
import { IGlobalPaginationDto } from '../../../common/dto/pagination.dto';
import { buildPagination } from '../../../common/helpers/pagination';
import { buildDateRange } from '../../../common/helpers/date-range';
import { buildNumberRange, containsInsensitive } from '../../../common/helpers/filters';

export const MEMBERSHIP_LIST_INCLUDE = {
  users: {
    select: {
      id: true,
      email: true,
      phone: true,
      first_name: true,
      last_name: true,
      role: true,
    },
  },
  tiers: {
    select: {
      id: true,
      name: true,
      required_points: true,
    },
  },
} satisfies Prisma.membershipInclude;

type MembershipFilterQuery = Pick<
  CGetMembershipListDto,
  | 'name'
  | 'email'
  | 'phone'
  | 'search'
  | 'search_by'
  | 'tier_id'
  | 'minPoints'
  | 'maxPoints'
  | 'startDate'
  | 'endDate'
>;

const nameFilter = (term: string): Prisma.usersWhereInput => {
  const contains = containsInsensitive(term);
  return { OR: [{ first_name: contains }, { last_name: contains }] };
};

const searchFilter = (
  term: string,
  searchBy: MembershipFilterQuery['search_by'],
): Prisma.usersWhereInput => {
  const contains = containsInsensitive(term);
  if (searchBy === 'name') return nameFilter(term);
  if (searchBy === 'email') return { email: contains };
  if (searchBy === 'phone') return { phone: contains };
  return {
    OR: [{ first_name: contains }, { last_name: contains }, { email: contains }, { phone: contains }],
  };
};

// Shared by the list and the export. Soft-deleted users are always hidden.
export const buildMembershipWhere = (
  query: MembershipFilterQuery,
): Prisma.membershipWhereInput => {
  const userFilters: Prisma.usersWhereInput[] = [{ deleted_at: null }];
  if (query.name) userFilters.push(nameFilter(query.name));
  if (query.email) userFilters.push({ email: containsInsensitive(query.email) });
  if (query.phone) userFilters.push({ phone: containsInsensitive(query.phone) });
  if (query.search) userFilters.push(searchFilter(query.search, query.search_by));

  const points = buildNumberRange(query.minPoints, query.maxPoints);
  const createdAt = buildDateRange(query.startDate, query.endDate);

  return {
    users: { AND: userFilters },
    ...(query.tier_id ? { tierId: query.tier_id } : {}),
    ...(points ? { points } : {}),
    ...(createdAt ? { created_at: createdAt } : {}),
  };
};

export const buildMembershipOrderBy = (
  sortBy: CGetMembershipListDto['sort_by'],
  sortOrder: CGetMembershipListDto['sort_order'],
): Prisma.membershipOrderByWithRelationInput =>
  sortBy === 'first_name' || sortBy === 'email'
    ? { users: { [sortBy]: sortOrder } }
    : { [sortBy]: sortOrder };

export const JGetMembershipListJob = async (
  prisma: PrismaService,
  query: CGetMembershipListDto,
): Promise<{ data: MembershipItem[]; pagination: IGlobalPaginationDto }> => {
  try {
    const { page, limit, sort_by, sort_order } = query;
    const where = buildMembershipWhere(query);

    const [data, total] = await Promise.all([
      prisma.membership.findMany({
        where,
        orderBy: buildMembershipOrderBy(sort_by, sort_order),
        skip: (page - 1) * limit,
        take: limit,
        include: MEMBERSHIP_LIST_INCLUDE,
      }),
      prisma.membership.count({ where }),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  } catch (error) {
    console.error('Error in JGetMembershipListJob:', error);
    throw error;
  }
};
