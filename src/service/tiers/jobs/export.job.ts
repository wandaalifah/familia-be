import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ExcelColumn,
  ExcelExportService,
  MAX_EXPORT_ROWS,
} from '../../../common/services/excel-export.service';
import { CExportTiersDto, TierItem } from '../dto/list.dto';
import { buildTierWhere, TIER_LIST_INCLUDE } from './list.job';

const COLUMNS: ExcelColumn<TierItem>[] = [
  { header: 'Name', accessor: (row) => row.name },
  { header: 'Description', accessor: (row) => row.description },
  { header: 'Level', accessor: (row) => row.level },
  { header: 'Required Points', accessor: (row) => row.required_points },
  { header: 'Members', accessor: (row) => row._count.memberships },
  { header: 'Created At', accessor: (row) => row.created_at },
];

export const JExportTiersJob = async (
  prisma: PrismaService,
  excel: ExcelExportService,
  query: CExportTiersDto,
): Promise<Buffer> => {
  try {
    const rows = await prisma.tiers.findMany({
      where: buildTierWhere(query),
      orderBy: { [query.sort_by]: query.sort_order },
      take: MAX_EXPORT_ROWS,
      include: TIER_LIST_INCLUDE,
    });

    return await excel.generateXlsxBuffer('Tiers', COLUMNS, rows);
  } catch (error) {
    console.error('Error in JExportTiersJob:', error);
    throw error;
  }
};
