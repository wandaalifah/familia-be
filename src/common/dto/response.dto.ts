import { IGlobalPaginationDto } from "./pagination.dto";

export interface IGlobalResponseDto<T = any> {
  status: boolean;
  message: string;
  data: T;
  new_user?: number;
  pagination?: IGlobalPaginationDto;
}
