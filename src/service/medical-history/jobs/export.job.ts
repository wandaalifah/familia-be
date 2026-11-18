import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ExcelColumn,
  ExcelExportService,
  MAX_EXPORT_ROWS,
} from '../../../common/services/excel-export.service';
import { CExportMedicalHistoryDto, MedicalHistoryWithPet } from '../dto/list.dto';
import { buildMedicalHistoryWhere, PET_WITH_OWNER_INCLUDE } from './list.job';

const COLUMNS: ExcelColumn<MedicalHistoryWithPet>[] = [
  { header: 'Administered At', accessor: (row) => row.administered_at },
  { header: 'Pet', accessor: (row) => row.pet.name },
  { header: 'Species', accessor: (row) => row.pet.species },
  {
    header: 'Owner',
    accessor: (row) => `${row.pet.users.first_name} ${row.pet.users.last_name}`.trim(),
  },
  { header: 'Owner Phone', accessor: (row) => row.pet.users.phone },
  { header: 'Type', accessor: (row) => row.type },
  { header: 'Title', accessor: (row) => row.title },
  { header: 'Vaccine', accessor: (row) => row.vaccine_name },
  { header: 'Dose', accessor: (row) => row.dose_number },
  { header: 'Complaint', accessor: (row) => row.complaint },
  { header: 'Clinical Signs', accessor: (row) => row.clinical_signs },
  { header: 'Diagnosis', accessor: (row) => row.diagnosis },
  { header: 'Weight (kg)', accessor: (row) => row.weight },
  { header: 'Temperature (°C)', accessor: (row) => row.temperature },
  { header: 'Appetite', accessor: (row) => row.appetite },
  { header: 'Defecation', accessor: (row) => row.defecation },
  { header: 'Urination', accessor: (row) => row.urination },
  { header: 'Vomiting', accessor: (row) => row.vomiting },
  { header: 'Treatment', accessor: (row) => row.treatment },
  { header: 'Prescription', accessor: (row) => row.prescription },
  { header: 'Notes', accessor: (row) => row.notes },
  { header: 'Doctor (DPJP)', accessor: (row) => row.doctor_name },
  { header: 'Medical Staff', accessor: (row) => row.medical_staff_name },
  { header: 'Next Due', accessor: (row) => row.next_due_date },
  { header: 'Discharged At', accessor: (row) => row.discharged_at },
];

export const JExportMedicalHistoryJob = async (
  prisma: PrismaService,
  excel: ExcelExportService,
  query: CExportMedicalHistoryDto,
): Promise<Buffer> => {
  try {
    const rows = await prisma.medical_history.findMany({
      where: buildMedicalHistoryWhere(query),
      orderBy: { [query.sort_by]: query.sort_order },
      take: MAX_EXPORT_ROWS,
      include: PET_WITH_OWNER_INCLUDE,
    });

    return await excel.generateXlsxBuffer('Medical Records', COLUMNS, rows);
  } catch (error) {
    console.error('Error in JExportMedicalHistoryJob:', error);
    throw error;
  }
};
