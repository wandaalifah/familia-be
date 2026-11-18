import { IGlobalPaginationDto } from '../dto/pagination.dto';

export const buildPagination = (
  page: number,
  limit: number,
  total: number,
): IGlobalPaginationDto => {
  const totalPages = Math.ceil(total / limit);
  return {
    current_page: page,
    total_page: totalPages,
    total_data: total,
    next: page < totalPages ? `?page=${page + 1}&limit=${limit}` : null,
    prev: page > 1 ? `?page=${page - 1}&limit=${limit}` : null,
  };
};
