import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

interface MappedError {
  httpStatus: HttpStatus;
  message: string;
}

const mapPrismaError = (
  error: Prisma.PrismaClientKnownRequestError,
): MappedError | null => {
  switch (error.code) {
    case 'P2002': {
      const target = (error.meta?.target as string[] | string | undefined) ?? '';
      const fields = Array.isArray(target) ? target.join(', ') : target;
      return {
        httpStatus: HttpStatus.CONFLICT,
        message: fields
          ? `Duplicate value for unique field: ${fields}`
          : 'Duplicate value for unique field',
      };
    }
    case 'P2003':
      return {
        httpStatus: HttpStatus.CONFLICT,
        message: 'Operation violates a relation constraint (record is still referenced)',
      };
    case 'P2025':
      return { httpStatus: HttpStatus.NOT_FOUND, message: 'Record not found' };
    default:
      return null;
  }
};

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const mapped = mapPrismaError(exception);

    if (!mapped) {
      console.error('Unhandled Prisma error:', exception);
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }

    return response
      .status(mapped.httpStatus)
      .json({ statusCode: mapped.httpStatus, message: mapped.message });
  }
}
