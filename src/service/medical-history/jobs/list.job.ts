import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CGetMedicalHistoryListDto, MedicalHistoryWithPet } from '../dto/list.dto';
import { IGlobalPaginationDto } from '../../../common/dto/pagination.dto';
import { buildPagination } from '../../../common/helpers/pagination';
import { buildDateRange } from '../../../common/helpers/date-range';
import { containsInsensitive } from '../../../common/helpers/filters';

export const PET_WITH_OWNER_INCLUDE = {
  pet: {
    select: {
      id: true,
      name: true,
      species: true,
      users: {
        select: { id: true, first_name: true, last_name: true, phone: true },
      },
    },
  },
} satisfies Prisma.medical_historyInclude;

type MedicalFilterQuery = Pick<
  CGetMedicalHistoryListDto,
  | 'search'
  | 'search_by'
  | 'petId'
  | 'userId'
  | 'type'
  | 'doctor_name'
  | 'medical_staff_name'
  | 'startDate'
  | 'endDate'
>;

// Without search_by, the term is matched against every searchable column
const searchFilter = (
  term: string,
  searchBy: MedicalFilterQuery['search_by'],
): Prisma.medical_historyWhereInput => {
  const contains = containsInsensitive(term);
  if (searchBy) return { [searchBy]: contains };
  return {
    OR: [
      { title: contains },
      { complaint: contains },
      { diagnosis: contains },
      { vaccine_name: contains },
      { doctor_name: contains },
      { medical_staff_name: contains },
      { pet: { name: contains } },
    ],
  };
};

// Shared by the list and the export
export const buildMedicalHistoryWhere = (
  query: MedicalFilterQuery,
): Prisma.medical_historyWhereInput => {
  const administeredAt = buildDateRange(query.startDate, query.endDate);

  return {
    ...(query.petId ? { petId: query.petId } : {}),
    ...(query.userId ? { pet: { userId: query.userId } } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.doctor_name ? { doctor_name: containsInsensitive(query.doctor_name) } : {}),
    ...(query.medical_staff_name
      ? { medical_staff_name: containsInsensitive(query.medical_staff_name) }
      : {}),
    ...(administeredAt ? { administered_at: administeredAt } : {}),
    ...(query.search ? { AND: [searchFilter(query.search, query.search_by)] } : {}),
  };
};

export const JGetMedicalHistoryListJob = async (
  prisma: PrismaService,
  query: CGetMedicalHistoryListDto,
): Promise<{ data: MedicalHistoryWithPet[]; pagination: IGlobalPaginationDto }> => {
  try {
    const { page, limit, sort_by, sort_order } = query;
    const where = buildMedicalHistoryWhere(query);

    const [data, total] = await Promise.all([
      prisma.medical_history.findMany({
        where,
        orderBy: { [sort_by]: sort_order },
        skip: (page - 1) * limit,
        take: limit,
        include: PET_WITH_OWNER_INCLUDE,
      }),
      prisma.medical_history.count({ where }),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  } catch (error) {
    console.error('Error in JGetMedicalHistoryListJob:', error);
    throw error;
  }
};
