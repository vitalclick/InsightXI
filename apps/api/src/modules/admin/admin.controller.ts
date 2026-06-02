import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminGuard } from "../auth/admin.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtPayload } from "../auth/auth.service";
import {
  CreatePostDto,
  SetFlagDto,
  UpdatePostDto,
  UpdateTicketDto,
  UpdateUserDto,
} from "./dto";

/**
 * Admin console API. Every route requires a valid JWT carrying the ADMIN role
 * (JwtAuthGuard verifies the token; AdminGuard enforces the role).
 */
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin")
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  // ── Read models ─────────────────────────────────────────────────────────
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

  // ── Write actions ─────────────────────────────────────────────────────────
  @Patch("users/:id")
  updateUser(
    @CurrentUser() actor: JwtPayload,
    @Param("id") id: string,
    @Body() body: UpdateUserDto,
  ) {
    return this.admin.updateUser(actor.email, id, body);
  }

  @Delete("users/:id")
  deleteUser(@CurrentUser() actor: JwtPayload, @Param("id") id: string) {
    return this.admin.deleteUser(actor.email, id);
  }

  @Patch("settings/flags/:key")
  setFlag(
    @CurrentUser() actor: JwtPayload,
    @Param("key") key: string,
    @Body() body: SetFlagDto,
  ) {
    return this.admin.setFlag(actor.email, key, body.enabled);
  }

  @Patch("support/:id")
  updateTicket(
    @CurrentUser() actor: JwtPayload,
    @Param("id") id: string,
    @Body() body: UpdateTicketDto,
  ) {
    return this.admin.updateTicket(actor.email, id, body);
  }

  @Post("content")
  createPost(@CurrentUser() actor: JwtPayload, @Body() body: CreatePostDto) {
    return this.admin.createPost(actor.email, body);
  }

  @Patch("content/:id")
  updatePost(
    @CurrentUser() actor: JwtPayload,
    @Param("id") id: string,
    @Body() body: UpdatePostDto,
  ) {
    return this.admin.updatePost(actor.email, id, body);
  }

  @Delete("content/:id")
  deletePost(@CurrentUser() actor: JwtPayload, @Param("id") id: string) {
    return this.admin.deletePost(actor.email, id);
  }

  @Post("subscriptions/:id/refund")
  refund(@CurrentUser() actor: JwtPayload, @Param("id") id: string) {
    return this.admin.refundTransaction(actor.email, id);
  }
}
