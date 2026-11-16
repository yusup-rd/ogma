import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { DatabaseModule } from "../database/database.module";
import { OwnerAuthController } from "./owner-auth.controller";
import { OwnerAuthGuard } from "./owner-auth.guard";
import { OwnerAuthService } from "./owner-auth.service";

@Module({
  imports: [DatabaseModule],
  controllers: [OwnerAuthController],
  providers: [
    OwnerAuthService,
    { provide: APP_GUARD, useClass: OwnerAuthGuard },
  ],
})
export class OwnerAuthModule {}
