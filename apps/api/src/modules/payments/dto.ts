import { IsIn, IsOptional, IsString } from "class-validator";
import { PaymentProvider } from "./gateways/gateway.types";

const PROVIDERS: PaymentProvider[] = ["paypal", "paystack", "flutterwave"];

export class CheckoutDto {
  @IsIn(PROVIDERS)
  provider!: PaymentProvider;

  /** Optional viewer currency / country hints (browser locale region). */
  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  country?: string;
}

export class ConfirmDto {
  @IsIn(PROVIDERS)
  provider!: PaymentProvider;

  @IsString()
  reference!: string;
}
