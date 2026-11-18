import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ExcelColumn,
  ExcelExportService,
  MAX_EXPORT_ROWS,
} from '../../../common/services/excel-export.service';
import { CExportPointsHistoryDto, PointsHistoryItem } from '../dto/list.dto';
import { buildPointsHistoryWhere, POINTS_HISTORY_INCLUDE } from './list.job';

const COLUMNS: ExcelColumn<PointsHistoryItem>[] = [
  { header: 'Date', accessor: (row) => row.created_at },
  {
    header: 'Customer',
    accessor: (row) =>
      `${row.membership.users.first_name} ${row.membership.users.last_name}`.trim(),
  },
  { header: 'Phone', accessor: (row) => row.membership.users.phone },
  { header: 'Type', accessor: (row) => row.type },
  { header: 'Amount', accessor: (row) => row.amount },
  { header: 'Description', accessor: (row) => row.description },
  { header: 'Reference ID', accessor: (row) => row.reference_id },
];

export const JExportPointsHistoryJob = async (
  prisma: PrismaService,
  excel: ExcelExportService,
  query: CExportPointsHistoryDto,
): Promise<Buffer> => {
  try {
    const rows = await prisma.points_history.findMany({
      where: buildPointsHistoryWhere(query),
      orderBy: { [query.sort_by]: query.sort_order },
      take: MAX_EXPORT_ROWS,
      include: POINTS_HISTORY_INCLUDE,
    });

    return await excel.generateXlsxBuffer('Points History', COLUMNS, rows);
  } catch (error) {
    console.error('Error in JExportPointsHistoryJob:', error);
    throw error;
  }
};
