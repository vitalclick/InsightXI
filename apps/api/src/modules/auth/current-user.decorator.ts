import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { JwtPayload } from "./auth.service";

/** Injects the authenticated JWT payload into a handler parameter. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload | undefined => {
    const req = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
    return req.user;
  },
);
