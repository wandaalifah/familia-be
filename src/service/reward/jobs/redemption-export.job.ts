import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ExcelColumn,
  ExcelExportService,
  MAX_EXPORT_ROWS,
} from '../../../common/services/excel-export.service';
import { CExportRedemptionDto, RedemptionItem } from '../dto/redeem.dto';
import { buildRedemptionWhere, REDEMPTION_INCLUDE } from './redemption-list.job';

const COLUMNS: ExcelColumn<RedemptionItem>[] = [
  { header: 'Date', accessor: (row) => row.created_at },
  { header: 'Customer', accessor: (row) => `${row.users.first_name} ${row.users.last_name}`.trim() },
  { header: 'Phone', accessor: (row) => row.users.phone },
  { header: 'Coupon', accessor: (row) => row.coupon.title },
  { header: 'Points Spent', accessor: (row) => row.points_spent },
];

export const JExportRedemptionJob = async (
  prisma: PrismaService,
  excel: ExcelExportService,
  query: CExportRedemptionDto,
): Promise<Buffer> => {
  try {
    const rows = await prisma.redemption_history.findMany({
      where: buildRedemptionWhere(query),
      orderBy: { [query.sort_by]: query.sort_order },
      take: MAX_EXPORT_ROWS,
      include: REDEMPTION_INCLUDE,
    });

    return await excel.generateXlsxBuffer('Redemptions', COLUMNS, rows);
  } catch (error) {
    console.error('Error in JExportRedemptionJob:', error);
    throw error;
  }
};
