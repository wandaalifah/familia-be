import { Controller, Get, Post, Patch, Delete, Param, Res, Query, Body, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { xlsxFileResponse } from "../../common/helpers/xlsx-response";
import { PetService } from "./pet.service";
import { CExportPetDto, CGetPetListDto } from "./dto/list.dto";
import { CCreatePetDto } from "./dto/create.dto";
import { CUpdatePetDto } from "./dto/update.dto";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard";
import { RolesGuard } from "../auth/guard/roles.guard";
import { Roles } from "../auth/guard/roles.decorator";
import { Role } from "@prisma/client";
import { IGlobalResponseDto } from "../../common/dto/response.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
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

  @Get('/export')
  async exportPet(
    @Query() query: CExportPetDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const buffer = await this.petService.exportPet(query);
    return xlsxFileResponse(res, 'pets', buffer);
  }

  @Patch('/restore/:id')
  async restorePet(
    @Param('id') id: string,
  ): Promise<IGlobalResponseDto> {
    const result = await this.petService.restorePet(id);
    return {
      status: true,
      message: 'Pet restored successfully',
      data: result,
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
