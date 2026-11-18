import * as ExcelJS from 'exceljs';
import type { Response } from 'express';
import { StreamableFile } from '@nestjs/common';
import { ExcelColumn, ExcelExportService } from './excel-export.service';
import { reportDateStamp, XLSX_CONTENT_TYPE, xlsxFileResponse } from '../helpers/xlsx-response';

interface Row {
  name: string;
  points: number;
  note: string | null;
  joined: Date;
}

const COLUMNS: ExcelColumn<Row>[] = [
  { header: 'Name', accessor: (row) => row.name },
  { header: 'Points', accessor: (row) => row.points },
  { header: 'Note', accessor: (row) => row.note },
  { header: 'Joined', accessor: (row) => row.joined },
];

const readSheet = async (buffer: Buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  return workbook.worksheets[0];
};

describe('ExcelExportService', () => {
  const service = new ExcelExportService();
  const rows: Row[] = [
    { name: 'Budi Santoso Wijaya', points: 650, note: null, joined: new Date('2026-03-01T03:30:00Z') },
    { name: 'Siti', points: 0, note: 'VIP', joined: new Date('2026-04-01T17:30:00Z') },
  ];

  it('produces a valid .xlsx with a header row and one row per record', async () => {
    const sheet = await readSheet(await service.generateXlsxBuffer('Members', COLUMNS, rows));

    expect(sheet.name).toBe('Members');
    expect(sheet.rowCount).toBe(3);
    expect(sheet.getRow(1).values).toEqual([undefined, 'Name', 'Points', 'Note', 'Joined']);
    expect(sheet.getRow(2).getCell(1).value).toBe('Budi Santoso Wijaya');
    expect(sheet.getRow(2).getCell(2).value).toBe(650);
  });

  it('styles the header row bold with a background fill', async () => {
    const sheet = await readSheet(await service.generateXlsxBuffer('Members', COLUMNS, rows));
    const cell = sheet.getRow(1).getCell(1);

    expect(cell.font?.bold).toBe(true);
    expect(cell.fill).toMatchObject({ type: 'pattern', pattern: 'solid' });
  });

  it('renders empty values as blanks and dates in Jakarta time', async () => {
    const sheet = await readSheet(await service.generateXlsxBuffer('Members', COLUMNS, rows));

    // A missing value is written as an empty cell, never as "null" / "undefined"
    expect(sheet.getRow(2).getCell(3).value ?? '').toBe('');
    // 03:30 UTC = 10:30 WIB; 17:30 UTC on 1 April = 00:30 WIB on 2 April
    expect(sheet.getRow(2).getCell(4).value).toBe('2026-03-01 10:30');
    expect(sheet.getRow(3).getCell(4).value).toBe('2026-04-02 00:30');
  });

  it('sizes columns from the longest value and keeps a minimum width', async () => {
    const sheet = await readSheet(await service.generateXlsxBuffer('Members', COLUMNS, rows));

    expect(sheet.getColumn(1).width).toBeGreaterThan('Budi Santoso Wijaya'.length);
    expect(sheet.getColumn(2).width).toBeGreaterThanOrEqual(10);
  });

  it('still produces a header-only sheet when there are no rows', async () => {
    const sheet = await readSheet(await service.generateXlsxBuffer('Members', COLUMNS, []));

    expect(sheet.rowCount).toBe(1);
  });

  it('truncates sheet names to the Excel limit of 31 characters', async () => {
    const sheet = await readSheet(
      await service.generateXlsxBuffer('A very long sheet name that exceeds the limit', COLUMNS, []),
    );

    expect(sheet.name.length).toBeLessThanOrEqual(31);
  });
});

describe('xlsxFileResponse', () => {
  it('sets the xlsx content type and a dated attachment filename', () => {
    const res = { set: jest.fn() } as unknown as Response;

    const file = xlsxFileResponse(res, 'pets', Buffer.from('x'));

    expect(file).toBeInstanceOf(StreamableFile);
    expect(res.set).toHaveBeenCalledWith({
      'Content-Type': XLSX_CONTENT_TYPE,
      'Content-Disposition': `attachment; filename="vet-clinic-pets-${reportDateStamp()}.xlsx"`,
    });
    expect(reportDateStamp()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
