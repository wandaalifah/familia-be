import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';

export const XLSX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// YYYY-MM-DD in the clinic's time zone
export const reportDateStamp = (date: Date = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(date);

// Sets the download headers and wraps the buffer; use with @Res({ passthrough: true }).
export const xlsxFileResponse = (
  res: Response,
  moduleName: string,
  buffer: Buffer,
): StreamableFile => {
  res.set({
    'Content-Type': XLSX_CONTENT_TYPE,
    'Content-Disposition': `attachment; filename="vet-clinic-${moduleName}-${reportDateStamp()}.xlsx"`,
  });
  return new StreamableFile(buffer);
};
