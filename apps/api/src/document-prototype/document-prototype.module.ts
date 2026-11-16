import { Module } from "@nestjs/common";
import { DocumentPrototypeController } from "./document-prototype.controller";
import { DocumentPrototypeService } from "./document-prototype.service";

@Module({
  controllers: [DocumentPrototypeController],
  providers: [DocumentPrototypeService],
  exports: [DocumentPrototypeService],
})
export class DocumentPrototypeModule {}
