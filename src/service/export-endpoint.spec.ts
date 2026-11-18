import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import * as ExcelJS from 'exceljs';
import { ExcelExportService } from '../common/services/excel-export.service';
import { XLSX_CONTENT_TYPE, reportDateStamp } from '../common/helpers/xlsx-response';
import { JwtAuthGuard } from './auth/guard/jwt-auth.guard';
import { RolesGuard } from './auth/guard/roles.guard';
import { TiersController } from './tiers/tiers.controller';
import { TiersService } from './tiers/tiers.service';

const binaryParser = (res: any, callback: (err: Error | null, body: Buffer) => void) => {
  const chunks: Buffer[] = [];
  res.on('data', (chunk: Buffer) => chunks.push(chunk));
  res.on('end', () => callback(null, Buffer.concat(chunks)));
};

describe('GET /admin/tiers/export', () => {
  let app: INestApplication;
  let allowed = true;
  const exportTiers = jest.fn();

  beforeAll(async () => {
    const excel = new ExcelExportService();
    exportTiers.mockImplementation((query: { search?: string }) =>
      excel.generateXlsxBuffer(
        'Tiers',
        [{ header: 'Name', accessor: (row: { name: string }) => row.name }],
        [{ name: query.search ?? 'Gold' }],
      ),
    );

    const moduleRef = await Test.createTestingModule({
      controllers: [TiersController],
      providers: [{ provide: TiersService, useValue: { exportTiers } }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => allowed })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ZodValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('streams a valid .xlsx with the required headers', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/tiers/export?search=Platinum')
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    expect(response.headers['content-type']).toContain(XLSX_CONTENT_TYPE);
    expect(response.headers['content-disposition']).toBe(
      `attachment; filename="vet-clinic-tiers-${reportDateStamp()}.xlsx"`,
    );

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(response.body as unknown as ExcelJS.Buffer);
    expect(workbook.worksheets[0].getRow(2).getCell(1).value).toBe('Platinum');
  });

  it('passes the list filters to the service and ignores pagination params', async () => {
    await request(app.getHttpServer())
      .get('/admin/tiers/export?search=Gold&sort_by=level')
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    expect(exportTiers).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'Gold', sort_by: 'level', sort_order: 'asc' }),
    );
  });

  it('rejects an invalid filter with 400 before touching the service', async () => {
    exportTiers.mockClear();

    await request(app.getHttpServer()).get('/admin/tiers/export?sort_by=nope').expect(400);

    expect(exportTiers).not.toHaveBeenCalled();
  });

  it('is blocked for non-admin users', async () => {
    allowed = false;

    await request(app.getHttpServer()).get('/admin/tiers/export').expect(403);

    allowed = true;
  });
});
