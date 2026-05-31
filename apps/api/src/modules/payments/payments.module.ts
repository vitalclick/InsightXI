import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { GeoService } from "./geo.service";
import { PaypalGateway } from "./gateways/paypal.gateway";
import { PaystackGateway } from "./gateways/paystack.gateway";
import { FlutterwaveGateway } from "./gateways/flutterwave.gateway";

/**
 * Premium billing: localized pricing (geolocation), and PayPal / Paystack /
 * Flutterwave checkout. Depends on the global AuthModule for UsersService +
 * AuthService (premium activation and fresh-token issuance).
 */
@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    GeoService,
    PaypalGateway,
    PaystackGateway,
    FlutterwaveGateway,
  ],
  exports: [PaymentsService, GeoService],
})
export class PaymentsModule {}
