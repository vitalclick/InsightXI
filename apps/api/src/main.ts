import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import {
  applySecurityHeaders,
  assertProductionConfig,
  buildCorsOptions,
} from "./common/security/security";

async function bootstrap() {
  // Refuse to boot with insecure config in production (default JWT secret,
  // wildcard CORS); warns instead of throwing in development.
  assertProductionConfig();

  // rawBody: true preserves the unparsed request body so payment webhook
  // signatures (Paystack HMAC, Flutterwave verif-hash, PayPal) can be verified.
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Hide the framework fingerprint and emit hardened security headers.
  app.getHttpAdapter().getInstance()?.disable?.("x-powered-by");
  app.use(applySecurityHeaders);

  // DTO validation everywhere (coding standard: DTO validation).
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  // CORS is restricted to the configured web origin(s) in production and
  // reflects any origin only for the local/dev demo (see buildCorsOptions).
  app.enableCors(buildCorsOptions());

  // Bind to 0.0.0.0 and prefer the platform-assigned PORT (Railway, Render,
  // Heroku, etc. inject it), falling back to API_PORT, then 4000 for local dev.
  const port = process.env.PORT ?? process.env.API_PORT ?? 4000;
  await app.listen(port, "0.0.0.0");
  // eslint-disable-next-line no-console
  console.log(`InsightXI API listening on http://0.0.0.0:${port}`);
}

bootstrap();
