import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { applyMigrations } from "./db/migrations";
import {
  applySecurityHeaders,
  assertProductionConfig,
  buildCorsOptions,
} from "./common/security/security";

async function bootstrap() {
  // Refuse to boot with insecure config in production (default JWT secret,
  // wildcard CORS); warns instead of throwing in development.
  assertProductionConfig();

  // Apply the SQL schema before any module initializes (Postgres only) so that
  // repositories reading the DB in their init hooks find the tables present.
  await applyMigrations();

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

  // Prefer the platform-assigned PORT (Railway, Render, Heroku, etc. inject it),
  // falling back to API_PORT, then 4000 for local dev.
  const port = process.env.PORT ?? process.env.API_PORT ?? 4000;
  // Bind all interfaces. Default to IPv4 0.0.0.0 — it works on every host and
  // is what Railway's public healthcheck probes. Where the api needs to be
  // reachable over Railway's IPv6-only *.railway.internal private network, set
  // HOST=:: (dual-stack) — but only on hosts whose stack supports it, since a
  // bare `::` bind throws EAFNOSUPPORT on IPv6-less environments.
  const host = process.env.HOST ?? "0.0.0.0";
  await app.listen(port, host);
  // eslint-disable-next-line no-console
  console.log(`InsightXI API listening on http://${host}:${port}`);
}

bootstrap();
