import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // DTO validation everywhere (coding standard: DTO validation).
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  app.enableCors({ origin: true, credentials: true });

  // Bind to 0.0.0.0 and prefer the platform-assigned PORT (Railway, Render,
  // Heroku, etc. inject it), falling back to API_PORT, then 4000 for local dev.
  const port = process.env.PORT ?? process.env.API_PORT ?? 4000;
  await app.listen(port, "0.0.0.0");
  // eslint-disable-next-line no-console
  console.log(`InsightXI API listening on http://0.0.0.0:${port}`);
}

bootstrap();
