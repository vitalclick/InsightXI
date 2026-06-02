import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { JwtPayload } from "./auth.service";

/**
 * Requires the ADMIN platform role. Use together with JwtAuthGuard:
 * @UseGuards(JwtAuthGuard, AdminGuard)
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    if (req.user?.role !== "ADMIN") {
      throw new ForbiddenException("Administrator access required");
    }
    return true;
  }
}
