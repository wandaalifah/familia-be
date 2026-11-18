export type PetSpeciesGroup = 'DOG' | 'CAT';
export type VaccineAudience = PetSpeciesGroup | 'BOTH';

export interface VaccineMasterItem {
  name: string;
  audience: VaccineAudience;
  description: string;
}

// Master data of vaccines. Rabies is available for both dogs and cats.
export const VACCINE_MASTER: readonly VaccineMasterItem[] = [
  { name: 'Rabies', audience: 'BOTH', description: 'Vaksin rabies' },
  { name: 'DHPPi', audience: 'DOG', description: 'Distemper, Hepatitis, Parvovirus, Parainfluenza' },
  { name: 'DHPPi + Lepto', audience: 'DOG', description: 'DHPPi + Leptospirosis' },
  { name: 'Bordetella', audience: 'DOG', description: 'Kennel cough' },
  { name: 'Canine Coronavirus', audience: 'DOG', description: 'Coronavirus anjing' },
  { name: 'F3 (Tricat)', audience: 'CAT', description: 'Panleukopenia, Calicivirus, Rhinotracheitis' },
  { name: 'F4', audience: 'CAT', description: 'F3 + Chlamydia' },
  { name: 'FeLV', audience: 'CAT', description: 'Feline Leukemia Virus' },
];

const DOG_KEYWORDS = ['anjing', 'dog', 'canine'];
const CAT_KEYWORDS = ['kucing', 'cat', 'feline'];

// pet.species is free text (e.g. "Anjing", "Kucing", "Dog"); map it to a known group.
export const resolveSpeciesGroup = (species?: string | null): PetSpeciesGroup | null => {
  const normalized = species?.trim().toLowerCase();
  if (!normalized) return null;
  if (DOG_KEYWORDS.some((keyword) => normalized.includes(keyword))) return 'DOG';
  if (CAT_KEYWORDS.some((keyword) => normalized.includes(keyword))) return 'CAT';
  return null;
};

export const getVaccinesForSpecies = (species?: string | null): VaccineMasterItem[] => {
  const group = resolveSpeciesGroup(species);
  return VACCINE_MASTER.filter(
    (vaccine) => vaccine.audience === 'BOTH' || vaccine.audience === group,
  ).map((vaccine) => ({ ...vaccine }));
};

export const isVaccineAllowedForSpecies = (
  vaccineName: string,
  species?: string | null,
): boolean => {
  const normalized = vaccineName.trim().toLowerCase();
  return getVaccinesForSpecies(species).some(
    (vaccine) => vaccine.name.toLowerCase() === normalized,
  );
};
