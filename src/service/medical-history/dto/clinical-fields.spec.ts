import { createMedicalHistorySchema } from './create.dto';
import { updateMedicalHistorySchema } from './update.dto';

const base = {
  petId: 'pet-1',
  type: 'RAWAT_INAP',
  title: 'Rawat Inap Hari ke-1',
  administered_at: '2026-11-17T08:00:00.000Z',
};

describe('medical history clinical fields', () => {
  it('accepts the structured inpatient report', () => {
    const parsed = createMedicalHistorySchema.safeParse({
      ...base,
      complaint: 'Vulnus, mata bengkak',
      diagnosis: 'Susp. FHV, Scabies',
      weight: 2.2,
      temperature: 38.5,
      appetite: 'Makan minum masih mau',
      defecation: 'Normal',
      urination: 'Normal',
      vomiting: 'Tidak ada',
      treatment: 'Infus RL',
      prescription: 'R/ Amoxicillin',
      notes: 'Kondisi stabil',
      doctor_name: 'drh. Anisa',
      medical_staff_name: 'drh. Budi',
    });

    expect(parsed.success).toBe(true);
  });

  it('rejects out-of-range vitals and strips the legacy description field', () => {
    expect(createMedicalHistorySchema.safeParse({ ...base, weight: 0 }).success).toBe(false);
    expect(createMedicalHistorySchema.safeParse({ ...base, temperature: 99 }).success).toBe(false);
    expect(createMedicalHistorySchema.parse({ ...base, description: 'x' })).not.toHaveProperty(
      'description',
    );
  });

  it('lets update clear a clinical field with null', () => {
    const parsed = updateMedicalHistorySchema.parse({ diagnosis: null, weight: 3 });

    expect(parsed.diagnosis).toBeNull();
    expect(parsed.weight).toBe(3);
  });

  it('requires discharged_at to be on or after administered_at', () => {
    const rawatInap = { ...base, type: 'RAWAT_INAP' };

    expect(
      createMedicalHistorySchema.safeParse({ ...rawatInap, discharged_at: '2026-11-16T08:00:00.000Z' })
        .success,
    ).toBe(false);
    expect(
      createMedicalHistorySchema.safeParse({ ...rawatInap, discharged_at: base.administered_at })
        .success,
    ).toBe(true);
  });
});
