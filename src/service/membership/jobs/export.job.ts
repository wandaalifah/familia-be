import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ExcelColumn,
  ExcelExportService,
  MAX_EXPORT_ROWS,
} from '../../../common/services/excel-export.service';
import { CExportMembershipDto, MembershipItem } from '../dto/list.dto';
import {
  buildMembershipOrderBy,
  buildMembershipWhere,
  MEMBERSHIP_LIST_INCLUDE,
} from './list.job';

const COLUMNS: ExcelColumn<MembershipItem>[] = [
  { header: 'Name', accessor: (row) => `${row.users.first_name} ${row.users.last_name}`.trim() },
  { header: 'Email', accessor: (row) => row.users.email },
  { header: 'Phone', accessor: (row) => row.users.phone },
  { header: 'Tier', accessor: (row) => row.tiers?.name },
  { header: 'Points', accessor: (row) => row.points },
  { header: 'Seasonal Points', accessor: (row) => row.seasonal_points },
  { header: 'Joined At', accessor: (row) => row.created_at },
];

export const JExportMembershipJob = async (
  prisma: PrismaService,
  excel: ExcelExportService,
  query: CExportMembershipDto,
): Promise<Buffer> => {
  try {
    const rows = await prisma.membership.findMany({
      where: buildMembershipWhere(query),
      orderBy: buildMembershipOrderBy(query.sort_by, query.sort_order),
      take: MAX_EXPORT_ROWS,
      include: MEMBERSHIP_LIST_INCLUDE,
    });

    return await excel.generateXlsxBuffer('Memberships', COLUMNS, rows);
  } catch (error) {
    console.error('Error in JExportMembershipJob:', error);
    throw error;
  }
};
