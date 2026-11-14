import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CGetPetListDto, PetItem } from '../dto/list.dto';
import { IGlobalPaginationDto } from '../../../common/dto/pagination.dto';

export const JGetPetListJob = async (
  prisma: PrismaService,
  query: CGetPetListDto,
): Promise<{ data: PetItem[]; pagination: IGlobalPaginationDto }> => {
  try {
    const {
      page = 1,
      limit = 10,
      sort_by,
      sort_order,
      search_by,
      search,
      userId,
      species,
      breed,
    } = query;

    const where: Prisma.petWhereInput = { deleted_at: null };

    // Filter by owner and exact species/breed
    if (userId) where.userId = userId;
    if (species) where.species = species;
    if (breed) where.breed = breed;

    // Generic search_by + search
    if (search && search_by) {
      switch (search_by) {
        case 'name':
          where.name = { contains: search, mode: 'insensitive' };
          break;
        case 'species':
          where.species = { contains: search, mode: 'insensitive' };
          break;
        case 'breed':
          where.breed = { contains: search, mode: 'insensitive' };
          break;
      }
    }

    // Build orderBy
    const orderBy: Prisma.petOrderByWithRelationInput = { [sort_by]: sort_order };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.pet.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.pet.count({ where }),
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
    console.error('Error in JGetPetListJob:', error);
    throw error;
  }
};
