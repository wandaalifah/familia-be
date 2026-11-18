import { Controller, Get, Param, Patch, Query, Request, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { NotificationService } from "./notification.service";
import { CGetNotificationListDto, CGetUserNotificationListDto } from "./dto/list.dto";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard";
import { RolesGuard } from "../auth/guard/roles.guard";
import { Roles } from "../auth/guard/roles.decorator";
import { IGlobalResponseDto } from "../../common/dto/response.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('/admin/notifications')
export class AdminNotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('/list')
  async getNotificationList(
    @Query() query: CGetNotificationListDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.notificationService.getNotificationList(query);
    return {
      status: true,
      message: 'Success get notification list',
      data: result.data,
      pagination: result.pagination,
    };
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
@Controller('/user/notifications')
export class UserNotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('/list')
  async getList(
    @Request() req: any,
    @Query() query: CGetUserNotificationListDto,
  ): Promise<IGlobalResponseDto> {
    const result = await this.notificationService.getUserNotificationList(req.user.id, query);
    return {
      status: true,
      message: 'Success get notifications',
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Get('/unread-count')
  async getUnreadCount(@Request() req: any): Promise<IGlobalResponseDto> {
    const result = await this.notificationService.getUnreadCount(req.user.id);
    return { status: true, message: 'Success get unread count', data: result };
  }

  @Patch('/read-all')
  async markAllRead(@Request() req: any): Promise<IGlobalResponseDto> {
    const result = await this.notificationService.markAllRead(req.user.id);
    return { status: true, message: 'Success mark all notifications as read', data: result };
  }

  @Patch('/read/:id')
  async markRead(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<IGlobalResponseDto> {
    const result = await this.notificationService.markRead(req.user.id, id);
    return { status: true, message: 'Success mark notification as read', data: result };
  }
}
