import {
  getVaccinesForSpecies,
  isVaccineAllowedForSpecies,
  resolveSpeciesGroup,
} from './vaccine-master';
import { calculateDewormingNextDueDate, calculateVaccineNextDueDate } from './vaccine-schedule';

const names = (species: string) => getVaccinesForSpecies(species).map((vaccine) => vaccine.name);

describe('vaccine master', () => {
  it('maps free-text species to a group', () => {
    expect(resolveSpeciesGroup('Anjing')).toBe('DOG');
    expect(resolveSpeciesGroup(' kucing persia ')).toBe('CAT');
    expect(resolveSpeciesGroup('Dog')).toBe('DOG');
    expect(resolveSpeciesGroup('Kelinci')).toBeNull();
    expect(resolveSpeciesGroup(null)).toBeNull();
  });

  it('offers Rabies to both dogs and cats', () => {
    expect(names('Anjing')).toContain('Rabies');
    expect(names('Kucing')).toContain('Rabies');
  });

  it('keeps species-specific vaccines separate', () => {
    expect(names('Anjing')).toContain('DHPPi');
    expect(names('Anjing')).not.toContain('F3 (Tricat)');
    expect(names('Kucing')).toContain('F3 (Tricat)');
    expect(names('Kucing')).not.toContain('DHPPi');
  });

  it('offers only Rabies for species without a dedicated catalog', () => {
    expect(names('Kelinci')).toEqual(['Rabies']);
  });

  it('checks a vaccine against the species case-insensitively', () => {
    expect(isVaccineAllowedForSpecies('dhppi', 'Anjing')).toBe(true);
    expect(isVaccineAllowedForSpecies('DHPPi', 'Kucing')).toBe(false);
  });
});

describe('next due date calculation', () => {
  const administeredAt = new Date('2026-03-15T00:00:00Z');

  it.each([1, 2, 3])('adds 1 month for basic dose %i', (dose) => {
    expect(calculateVaccineNextDueDate(administeredAt, dose)).toEqual(
      new Date('2026-04-15T00:00:00Z'),
    );
  });

  it.each([4, 5, 9])('adds 12 months from dose %i onward', (dose) => {
    expect(calculateVaccineNextDueDate(administeredAt, dose)).toEqual(
      new Date('2027-03-15T00:00:00Z'),
    );
  });

  it('schedules routine deworming 30 days later', () => {
    expect(calculateDewormingNextDueDate(administeredAt)).toEqual(new Date('2026-04-14T00:00:00Z'));
  });
});
