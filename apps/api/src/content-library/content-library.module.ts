import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { ContentLibraryController } from "./content-library.controller";
import { ContentLibraryService } from "./content-library.service";

@Module({
  imports: [DatabaseModule],
  controllers: [ContentLibraryController],
  providers: [ContentLibraryService],
})
export class ContentLibraryModule {}
