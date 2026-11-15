import "reflect-metadata";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { z } from "zod";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useBodyParser("json", { limit: "420kb" });
  const config = app.get(ConfigService);
  const port = z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .parse(config.get("API_PORT") ?? 3001);

  app.setGlobalPrefix("api");
  app.enableShutdownHooks();
  await app.listen(port);
}

void bootstrap();
