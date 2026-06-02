import { Controller, Get, UseGuards } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminGuard } from "../auth/admin.guard";

/**
 * Admin console API. Every route requires a valid JWT carrying the ADMIN role
 * (JwtAuthGuard verifies the token; AdminGuard enforces the role).
 */
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin")
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("overview")
  overview() {
    return this.admin.overview();
  }

  @Get("users")
  users() {
    return this.admin.listUsers();
  }

  @Get("subscriptions")
  subscriptions() {
    return this.admin.subscriptions();
  }

  @Get("predictions")
  predictions() {
    return this.admin.predictions();
  }

  @Get("fixtures")
  fixtures() {
    return this.admin.fixtures();
  }

  @Get("content")
  content() {
    return this.admin.content();
  }

  @Get("support")
  support() {
    return this.admin.support();
  }

  @Get("audit")
  audit() {
    return this.admin.audit();
  }

  @Get("settings")
  settings() {
    return this.admin.settings();
  }
}
