import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { JwtPayload } from "./auth.service";

/**
 * Requires a PREMIUM subscription tier. Use together with JwtAuthGuard:
 * @UseGuards(JwtAuthGuard, PremiumGuard)
 */
@Injectable()
export class PremiumGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<{ user?: JwtPayload }>();
    if (req.user?.tier !== "PREMIUM") {
      throw new ForbiddenException(
        "This insight requires an InsightXI Premium subscription",
      );
    }
    return true;
  }
}
