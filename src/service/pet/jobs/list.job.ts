import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CGetPetListDto, PetListItem, PetStatus } from '../dto/list.dto';
import { IGlobalPaginationDto } from '../../../common/dto/pagination.dto';
import { buildPagination } from '../../../common/helpers/pagination';
import { containsInsensitive } from '../../../common/helpers/filters';

export const PET_LIST_INCLUDE = {
  users: {
    select: { id: true, first_name: true, last_name: true, phone: true },
  },
  _count: { select: { medical_history: true } },
} satisfies Prisma.petInclude;

type PetFilterQuery = Pick<
  CGetPetListDto,
  'search' | 'search_by' | 'userId' | 'species' | 'breed' | 'is_neutered'
> & { status: PetStatus };

const archiveFilter = (status: PetStatus): Prisma.petWhereInput => {
  if (status === 'ARCHIVED') return { deleted_at: { not: null } };
  if (status === 'ALL') return {};
  return { deleted_at: null };
};

const ownerFilter = (term: string): Prisma.petWhereInput => {
  const contains = containsInsensitive(term);
  return {
    users: { OR: [{ first_name: contains }, { last_name: contains }, { phone: contains }] },
  };
};

const searchFilter = (
  term: string,
  searchBy: PetFilterQuery['search_by'],
): Prisma.petWhereInput => {
  const contains = containsInsensitive(term);
  if (searchBy === 'name') return { name: contains };
  if (searchBy === 'species') return { species: contains };
  if (searchBy === 'breed') return { breed: contains };
  if (searchBy === 'owner') return ownerFilter(term);
  return { OR: [{ name: contains }, { species: contains }, { breed: contains }, ownerFilter(term)] };
};

// Shared by the list and the export. Pets of soft-deleted owners are always hidden.
export const buildPetWhere = (query: PetFilterQuery): Prisma.petWhereInput => ({
  AND: [
    archiveFilter(query.status),
    { users: { deleted_at: null } },
    ...(query.search ? [searchFilter(query.search, query.search_by)] : []),
  ],
  ...(query.userId ? { userId: query.userId } : {}),
  ...(query.species ? { species: query.species } : {}),
  ...(query.breed ? { breed: query.breed } : {}),
  ...(query.is_neutered === undefined ? {} : { is_neutered: query.is_neutered }),
});

export const JGetPetListJob = async (
  prisma: PrismaService,
  query: CGetPetListDto,
): Promise<{ data: PetListItem[]; pagination: IGlobalPaginationDto }> => {
  try {
    const { page, limit, sort_by, sort_order } = query;
    const where = buildPetWhere(query);

    const [data, total] = await Promise.all([
      prisma.pet.findMany({
        where,
        orderBy: { [sort_by]: sort_order },
        skip: (page - 1) * limit,
        take: limit,
        include: PET_LIST_INCLUDE,
      }),
      prisma.pet.count({ where }),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  } catch (error) {
    console.error('Error in JGetPetListJob:', error);
    throw error;
  }
};
