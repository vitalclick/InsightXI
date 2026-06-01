import { Controller, Get, HttpCode, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtPayload } from "../auth/auth.service";
import { NotificationsService } from "./notifications.service";

@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.notifications.list(user.sub);
  }

  @Get("unread-count")
  async unreadCount(@CurrentUser() user: JwtPayload) {
    return { count: await this.notifications.unreadCount(user.sub) };
  }

  @Post(":id/read")
  @HttpCode(200)
  markRead(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.notifications.markRead(user.sub, id);
  }

  @Post("read-all")
  @HttpCode(200)
  markAllRead(@CurrentUser() user: JwtPayload) {
    return this.notifications.markAllRead(user.sub);
  }
}
