import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { getVaccinesForSpecies, VaccineMasterItem } from '../../../common/vaccines/vaccine-master';
import { CGetVaccinesDto } from '../dto/vaccines.dto';

// Vaccine catalog for a pet's species (Rabies is available for dogs and cats).
export const JGetVaccinesJob = async (
  prisma: PrismaService,
  query: CGetVaccinesDto,
): Promise<VaccineMasterItem[]> => {
  try {
    if (query.petId) {
      const pet = await prisma.pet.findFirst({
        where: { id: query.petId, deleted_at: null },
        select: { species: true },
      });
      if (!pet) {
        throw new NotFoundException('Pet not found');
      }
      return getVaccinesForSpecies(pet.species);
    }

    if (query.species) {
      return getVaccinesForSpecies(query.species);
    }

    throw new BadRequestException('Provide either petId or species');
  } catch (error) {
    console.error('Error in JGetVaccinesJob:', error);
    throw error;
  }
};
