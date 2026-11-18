import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

export type ExcelCellValue = string | number | boolean | Date | null | undefined;

export interface ExcelColumn<T> {
  header: string;
  accessor: (row: T) => ExcelCellValue;
}

// Safety cap: an export loads every matching row into memory
export const MAX_EXPORT_ROWS = 50_000;

const REPORT_TIME_ZONE = 'Asia/Jakarta';
const SHEET_NAME_MAX_LENGTH = 31;
const MIN_COLUMN_WIDTH = 10;
const MAX_COLUMN_WIDTH = 60;
const COLUMN_PADDING = 2;
const HEADER_FILL_COLOR = 'FFE5E7EB';

export const formatReportDateTime = (date: Date): string =>
  new Intl.DateTimeFormat('sv-SE', {
    timeZone: REPORT_TIME_ZONE,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);

const toCellValue = (value: ExcelCellValue): string | number | boolean => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return formatReportDateTime(value);
  return value;
};

@Injectable()
export class ExcelExportService {
  // Builds a single-sheet .xlsx: bold shaded header row, auto-width columns.
  async generateXlsxBuffer<T>(
    sheetName: string,
    columns: ExcelColumn<T>[],
    rows: T[],
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName.slice(0, SHEET_NAME_MAX_LENGTH));

    const matrix = rows.map((row) => columns.map((column) => toCellValue(column.accessor(row))));

    sheet.addRow(columns.map((column) => column.header));
    matrix.forEach((cells) => sheet.addRow(cells));

    const header = sheet.getRow(1);
    header.font = { bold: true };
    header.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL_COLOR } };
    });

    columns.forEach((column, index) => {
      const longest = matrix.reduce(
        (max, cells) => Math.max(max, String(cells[index]).length),
        column.header.length,
      );
      sheet.getColumn(index + 1).width = Math.min(
        Math.max(longest + COLUMN_PADDING, MIN_COLUMN_WIDTH),
        MAX_COLUMN_WIDTH,
      );
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}
