import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ExcelColumn,
  ExcelExportService,
  MAX_EXPORT_ROWS,
} from '../../../common/services/excel-export.service';
import { CExportRewardDto, RewardItem } from '../dto/list.dto';
import { buildRewardWhere, REWARD_LIST_INCLUDE } from './list.job';

const COLUMNS: ExcelColumn<RewardItem>[] = [
  { header: 'Title', accessor: (row) => row.title },
  { header: 'Description', accessor: (row) => row.description },
  { header: 'Points Cost', accessor: (row) => row.points_cost },
  { header: 'Total Redemptions', accessor: (row) => row._count.redemptions },
  { header: 'Created At', accessor: (row) => row.created_at },
];

export const JExportRewardJob = async (
  prisma: PrismaService,
  excel: ExcelExportService,
  query: CExportRewardDto,
): Promise<Buffer> => {
  try {
    const rows = await prisma.coupon.findMany({
      where: buildRewardWhere(query),
      orderBy: { [query.sort_by]: query.sort_order },
      take: MAX_EXPORT_ROWS,
      include: REWARD_LIST_INCLUDE,
    });

    return await excel.generateXlsxBuffer('Coupons', COLUMNS, rows);
  } catch (error) {
    console.error('Error in JExportRewardJob:', error);
    throw error;
  }
};
