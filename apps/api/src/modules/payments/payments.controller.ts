import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { JwtPayload } from "../auth/auth.service";
import { CheckoutDto, ConfirmDto } from "./dto";
import { GeoService, RequestGeoHints } from "./geo.service";
import { PaymentsService } from "./payments.service";
import { PaymentProvider } from "./gateways/gateway.types";

/** Minimal structural view of the underlying HTTP request (avoids an
 *  express type dependency; rawBody is populated by NestFactory rawBody). */
interface HttpRequest {
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  rawBody?: Buffer;
}

function hintsFrom(
  req: HttpRequest,
  query: { currency?: string; country?: string },
): RequestGeoHints {
  const header = (name: string): string | undefined => {
    const v = req.headers[name];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    cfCountry: header("cf-ipcountry"),
    country: query.country ?? header("x-country"),
    currency: query.currency,
  };
}

@Controller("payments")
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly geo: GeoService,
    private readonly auth: AuthService,
  ) {}

  /** Public — localized plan pricing + gateway availability + PayPal client id. */
  @Get("plan")
  plan(
    @Req() req: HttpRequest,
    @Query("currency") currency?: string,
    @Query("country") country?: string,
  ) {
    return {
      plan: this.geo.localizePlan(hintsFrom(req, { currency, country })),
      providers: this.payments.availability(),
      paypalClientId: process.env.PAYPAL_CLIENT_ID ?? null,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post("checkout")
  checkout(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CheckoutDto,
    @Req() req: HttpRequest,
  ) {
    return this.payments.createCheckout(
      { id: user.sub, email: user.email },
      dto.provider,
      hintsFrom(req, { currency: dto.currency, country: dto.country }),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post("confirm")
  confirm(@CurrentUser() user: JwtPayload, @Body() dto: ConfirmDto) {
    return this.payments.confirm({ id: user.sub }, dto.provider, dto.reference);
  }

  /** Public webhook receiver (signature-verified per provider). */
  @Post("webhook/:provider")
  webhook(@Param("provider") provider: PaymentProvider, @Req() req: HttpRequest) {
    const raw = req.rawBody?.toString("utf8") ?? JSON.stringify(req.body ?? {});
    const headers: Record<string, string | undefined> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      headers[k] = Array.isArray(v) ? v[0] : v;
    }
    return this.payments.handleWebhook(provider, raw, headers);
  }
}
