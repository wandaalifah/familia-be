import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ExcelColumn,
  ExcelExportService,
  MAX_EXPORT_ROWS,
} from '../../../common/services/excel-export.service';
import { CExportPetDto, PetListItem, PetStatus } from '../dto/list.dto';
import { buildPetWhere, PET_LIST_INCLUDE } from './list.job';

type PetExportRow = PetListItem & { deleted_at: Date | null };

const COLUMNS: ExcelColumn<PetExportRow>[] = [
  { header: 'Name', accessor: (row) => row.name },
  { header: 'Species', accessor: (row) => row.species },
  { header: 'Breed', accessor: (row) => row.breed },
  { header: 'Birth Date', accessor: (row) => row.birth_date },
  { header: 'Neutered', accessor: (row) => (row.is_neutered ? 'Yes' : 'No') },
  { header: 'Owner', accessor: (row) => `${row.users.first_name} ${row.users.last_name}`.trim() },
  { header: 'Owner Phone', accessor: (row) => row.users.phone },
  { header: 'Medical Records', accessor: (row) => row._count.medical_history },
  { header: 'Status', accessor: (row) => (row.deleted_at ? 'Archived' : 'Active') },
  { header: 'Created At', accessor: (row) => row.created_at },
];

const resolveStatus = (query: CExportPetDto): PetStatus =>
  query.status ?? (query.includeDeleted ? 'ALL' : 'ACTIVE');

export const JExportPetJob = async (
  prisma: PrismaService,
  excel: ExcelExportService,
  query: CExportPetDto,
): Promise<Buffer> => {
  try {
    const rows = await prisma.pet.findMany({
      where: buildPetWhere({ ...query, status: resolveStatus(query) }),
      orderBy: { [query.sort_by]: query.sort_order },
      take: MAX_EXPORT_ROWS,
      include: PET_LIST_INCLUDE,
    });

    return await excel.generateXlsxBuffer('Pets', COLUMNS, rows);
  } catch (error) {
    console.error('Error in JExportPetJob:', error);
    throw error;
  }
};
