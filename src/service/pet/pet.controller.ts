import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from "@nestjs/common";
import { PetService } from "./pet.service";
import { CGetPetListDto } from "./dto/list.dto";
import { CCreatePetDto } from "./dto/create.dto";
import { CUpdatePetDto } from "./dto/update.dto";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard";
import { IGlobalResponseDto } from "../../common/dto/response.dto";

@UseGuards(JwtAuthGuard)
@Controller('/admin/pet')
export class PetController {
  constructor(private readonly petService: PetService) {}

  @Get('/list')
  async getPetList(
    @Query() query: CGetPetListDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.petService.getPetList(query);
    return {
      status: true,
      message: 'Success get pet list',
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Get('/detail/:id')
  async getPetDetail(
    @Param('id') id: string,
  ): Promise<IGlobalResponseDto> {
    const result = await this.petService.getPetDetail(id);
    return {
      status: true,
      message: 'Success get pet detail',
      data: result,
    };
  }

  @Post('/create')
  async createPet(
    @Body() body: CCreatePetDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.petService.createPet(body);
    return {
      status: true,
      message: 'Success create pet',
      data: result,
    };
  }

  @Patch('/update/:id')
  async updatePet(
    @Param('id') id: string,
    @Body() body: CUpdatePetDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.petService.updatePet(id, body);
    return {
      status: true,
      message: 'Success update pet',
      data: result,
    };
  }

  @Delete('/delete/:id')
  async deletePet(
    @Param('id') id: string,
  ): Promise<IGlobalResponseDto> {
    const result = await this.petService.deletePet(id);
    return {
      status: true,
      message: 'Success delete pet',
      data: result,
    };
  }
}
