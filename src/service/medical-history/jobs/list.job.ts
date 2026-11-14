import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CGetMedicalHistoryListDto, MedicalHistoryItem } from '../dto/list.dto';
import { IGlobalPaginationDto } from '../../../common/dto/pagination.dto';

export const JGetMedicalHistoryListJob = async (
  prisma: PrismaService,
  query: CGetMedicalHistoryListDto,
): Promise<{ data: MedicalHistoryItem[]; pagination: IGlobalPaginationDto }> => {
  try {
    const {
      page = 1,
      limit = 10,
      sort_by,
      sort_order,
      search_by,
      search,
      petId,
      type,
    } = query;

    const where: Prisma.medical_historyWhereInput = {};

    // Filter by pet and record type
    if (petId) where.petId = petId;
    if (type) where.type = type;

    // Generic search_by + search
    if (search && search_by) {
      switch (search_by) {
        case 'title':
          where.title = { contains: search, mode: 'insensitive' };
          break;
        case 'description':
          where.description = { contains: search, mode: 'insensitive' };
          break;
        case 'vaccine_name':
          where.vaccine_name = { contains: search, mode: 'insensitive' };
          break;
        case 'doctor_name':
          where.doctor_name = { contains: search, mode: 'insensitive' };
          break;
      }
    }

    // Build orderBy
    const orderBy: Prisma.medical_historyOrderByWithRelationInput = { [sort_by]: sort_order };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.medical_history.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.medical_history.count({ where }),
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
    console.error('Error in JGetMedicalHistoryListJob:', error);
    throw error;
  }
};
