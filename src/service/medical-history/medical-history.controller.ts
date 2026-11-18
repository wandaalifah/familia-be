import { Controller, Get, Post, Patch, Delete, Param, Res, Query, Body, UseGuards } from "@nestjs/common";
import { MedicalHistoryService } from "./medical-history.service";
import { CExportMedicalHistoryDto, CGetMedicalHistoryListDto, CGetUpcomingDuesDto } from "./dto/list.dto";
import type { Response } from "express";
import { xlsxFileResponse } from "../../common/helpers/xlsx-response";
import { CCreateMedicalHistoryDto } from "./dto/create.dto";
import { CGetVaccinesDto } from "./dto/vaccines.dto";
import { CUpdateMedicalHistoryDto } from "./dto/update.dto";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard";
import { RolesGuard } from "../auth/guard/roles.guard";
import { Roles } from "../auth/guard/roles.decorator";
import { Role } from "@prisma/client";
import { IGlobalResponseDto } from "../../common/dto/response.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('/admin/medical-history')
export class MedicalHistoryController {
  constructor(private readonly medicalHistoryService: MedicalHistoryService) {}

  @Get('/list')
  async getMedicalHistoryList(
    @Query() query: CGetMedicalHistoryListDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.medicalHistoryService.getMedicalHistoryList(query);
    return {
      status: true,
      message: 'Success get medical history list',
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Get('/export')
  async exportMedicalHistory(
    @Query() query: CExportMedicalHistoryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const buffer = await this.medicalHistoryService.exportMedicalHistory(query);
    return xlsxFileResponse(res, 'medical-records', buffer);
  }

  @Get('/vaccines')
  async getVaccines(
    @Query() query: CGetVaccinesDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.medicalHistoryService.getVaccines(query);
    return {
      status: true,
      message: 'Success get vaccines',
      data: result,
    };
  }

  @Get('/upcoming-dues')
  async getUpcomingDues(
    @Query() query: CGetUpcomingDuesDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.medicalHistoryService.getUpcomingDues(query);
    return {
      status: true,
      message: 'Success get upcoming dues',
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Get('/detail/:id')
  async getMedicalHistoryDetail(
    @Param('id') id: string,
  ): Promise<IGlobalResponseDto> {
    const result = await this.medicalHistoryService.getMedicalHistoryDetail(id);
    return {
      status: true,
      message: 'Success get medical history detail',
      data: result,
    };
  }

  @Post('/create')
  async createMedicalHistory(
    @Body() body: CCreateMedicalHistoryDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.medicalHistoryService.createMedicalHistory(body);
    return {
      status: true,
      message: 'Success create medical history',
      data: result,
    };
  }

  @Patch('/update/:id')
  async updateMedicalHistory(
    @Param('id') id: string,
    @Body() body: CUpdateMedicalHistoryDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.medicalHistoryService.updateMedicalHistory(id, body);
    return {
      status: true,
      message: 'Success update medical history',
      data: result,
    };
  }

  @Delete('/delete/:id')
  async deleteMedicalHistory(
    @Param('id') id: string,
  ): Promise<IGlobalResponseDto> {
    const result = await this.medicalHistoryService.deleteMedicalHistory(id);
    return {
      status: true,
      message: 'Success delete medical history',
      data: result,
    };
  }
}
