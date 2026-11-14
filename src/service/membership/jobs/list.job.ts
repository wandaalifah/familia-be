import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CGetMembershipListDto, MembershipItem } from '../dto/list.dto';
import { IGlobalPaginationDto } from '../../../common/dto/pagination.dto';

export const JGetMembershipListJob = async (
  prisma: PrismaService,
  query: CGetMembershipListDto,
): Promise<{ data: MembershipItem[]; pagination: IGlobalPaginationDto }> => {
  try {
    const { page, limit, name, email, phone, sort_by, sort_order, search_by, search } = query;

    const where: Prisma.membershipWhereInput = {};

    // Filter by name (search in user's first_name or last_name)
    if (name) {
      where.users = {
        OR: [
          { first_name: { contains: name, mode: 'insensitive' } },
          { last_name: { contains: name, mode: 'insensitive' } },
        ],
      };
    }

    // Filter by email
    if (email) {
      where.users = {
        ...((where.users as Prisma.usersWhereInput) ?? {}),
        email: { contains: email, mode: 'insensitive' },
      };
    }

    // Filter by phone
    if (phone) {
      where.users = {
        ...((where.users as Prisma.usersWhereInput) ?? {}),
        phone: { contains: phone, mode: 'insensitive' },
      };
    }

    // Generic search_by + search
    if (search && search_by) {
      const searchFilter: Prisma.membershipWhereInput = (() => {
        switch (search_by) {
          case 'name':
            return {
              users: {
                OR: [
                  { first_name: { contains: search, mode: 'insensitive' } },
                  { last_name: { contains: search, mode: 'insensitive' } },
                ],
              },
            };
          case 'email':
            return {
              users: { email: { contains: search, mode: 'insensitive' } },
            };
          case 'phone':
            return {
              users: { phone: { contains: search, mode: 'insensitive' } },
            };
          default:
            return {};
        }
      })();

      // Merge with existing where using AND
      if (Object.keys(where).length > 0) {
        where.AND = [searchFilter];
      } else {
        Object.assign(where, searchFilter);
      }
    }

    // Build orderBy based on sort_by
    const orderBy: Prisma.membershipOrderByWithRelationInput = (() => {
      switch (sort_by) {
        case 'first_name':
        case 'email':
          return { users: { [sort_by]: sort_order } };
        default:
          return { [sort_by]: sort_order };
      }
    })();

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.membership.findMany({
        where,
        orderBy,
        skip,
        take: +limit,
        include: {
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
        },
      }),
      prisma.membership.count({ where }),
    ]);

    const normalizedData = data.map((item) => ({
      ...item,
      users: item.users
        ? {
            ...item.users,
            last_name: item.users.last_name ?? undefined,
          }
        : undefined,
    }));

    const total_pages = Math.ceil(total / limit);

    return {
      data: normalizedData as MembershipItem[],
      pagination: {
        current_page: page,
        total_page: total_pages,
        total_data: total,
        next: page < total_pages ? `?page=${page + 1}&limit=${limit}` : null,
        prev: page > 1 ? `?page=${page - 1}&limit=${limit}` : null,
      },
    };
  } catch (error) {
    console.error('Error in JGetMembershipListJob:', error);
    throw error;
  }
}
