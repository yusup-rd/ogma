import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import {
  archiveLibraryEntrySchema,
  deleteLibraryEntrySchema,
  createLibraryEntrySchema,
  updateLibraryEntrySchema,
} from "@ogma/contracts/content-library";
import type { z } from "zod";
import type { OwnerRequest } from "../owner-auth/owner-auth.guard";
import { ContentLibraryService } from "./content-library.service";

function ownerIdFor(request: OwnerRequest) {
  if (!request.ownerId) throw new UnauthorizedException();
  return request.ownerId;
}

function readBody<T>(schema: z.ZodType<T>, body: unknown) {
  const result = schema.safeParse(body);
  if (!result.success)
    throw new BadRequestException("Invalid Library entry details.");
  return result.data;
}

@Controller("library")
export class ContentLibraryController {
  constructor(private readonly library: ContentLibraryService) {}

  @Get()
  list(@Req() request: OwnerRequest, @Query("archived") archived?: string) {
    return this.library.list(ownerIdFor(request), archived === "true");
  }

  @Get("status")
  status(@Req() request: OwnerRequest) {
    return this.library.status(ownerIdFor(request));
  }

  @Post()
  create(@Req() request: OwnerRequest, @Body() body: unknown) {
    const { id, content } = readBody(createLibraryEntrySchema, body);
    return this.library.create(ownerIdFor(request), id, content);
  }

  @Patch(":id")
  update(
    @Req() request: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    const { expectedRevision, content } = readBody(
      updateLibraryEntrySchema,
      body,
    );
    return this.library.update(
      ownerIdFor(request),
      id,
      expectedRevision,
      content,
    );
  }

  @Delete(":id")
  delete(
    @Req() request: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    const { expectedRevision } = readBody(deleteLibraryEntrySchema, body);
    return this.library.delete(ownerIdFor(request), id, expectedRevision);
  }

  @Post(":id/archive")
  archive(
    @Req() request: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    const { expectedRevision, archived } = readBody(
      archiveLibraryEntrySchema,
      body,
    );
    return this.library.archive(
      ownerIdFor(request),
      id,
      expectedRevision,
      archived,
    );
  }
}
