import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import {
  resumeDocumentSchema,
  titleSchema,
} from "@ogma/contracts/resume-workspace";
import { z } from "zod";
import type { Response } from "express";
import { DocumentPrototypeService } from "../document-prototype/document-prototype.service";
import type { OwnerRequest } from "../owner-auth/owner-auth.guard";
import { exportResume } from "../resume-layouts/resume-export";
import { paginateResume } from "../resume-layouts/paginate-resume";
import { renderResumeLayout } from "../resume-layouts/render-resume-layout";
import { ResumesService } from "./resumes.service";
import { ResumeCheckpointsService } from "./resume-checkpoints.service";

const createSchema = z.object({
  id: z.uuid(),
  title: titleSchema,
  document: resumeDocumentSchema.optional(),
});
const duplicateSchema = z.object({ id: z.uuid() });
const archiveSchema = z.object({ archived: z.boolean() });
const revisionSchema = z.int().positive().max(2_147_483_646);
const exportSchema = z.object({ expectedRevision: revisionSchema });
const newCheckpointSchema = exportSchema.extend({
  id: z.uuid(),
  name: titleSchema,
});
const restoreCheckpointSchema = exportSchema.extend({ id: z.uuid() });
const saveSchema = z.object({
  expectedRevision: revisionSchema,
  title: titleSchema,
  document: resumeDocumentSchema,
});
const lockSchema = z.discriminatedUnion("locked", [
  z.object({ locked: z.literal(true), expectedRevision: revisionSchema }),
  saveSchema.extend({ locked: z.literal(false) }),
]);

function readBody<T>(schema: z.ZodType<T>, body: unknown) {
  const result = schema.safeParse(body);
  if (!result.success) throw new BadRequestException("Invalid resume details.");
  return result.data;
}

function ownerIdFor(request: OwnerRequest) {
  if (!request.ownerId) throw new UnauthorizedException();
  return request.ownerId;
}

@Controller("resumes")
export class ResumesController {
  private readonly thumbnails = new Map<
    string,
    { html: string; expiresAt: number }
  >();
  constructor(
    private readonly resumes: ResumesService,
    private readonly documents: DocumentPrototypeService,
    private readonly checkpoints: ResumeCheckpointsService,
  ) {}

  @Get()
  list(@Req() request: OwnerRequest, @Query("archived") archived?: string) {
    return this.resumes.list(ownerIdFor(request), archived === "true");
  }

  @Post()
  create(@Req() request: OwnerRequest, @Body() body: unknown) {
    const { id, title, document } = readBody(createSchema, body);
    return this.resumes.create(ownerIdFor(request), id, title, document);
  }

  @Get(":id")
  get(@Req() request: OwnerRequest, @Param("id", ParseUUIDPipe) id: string) {
    return this.resumes.get(ownerIdFor(request), id);
  }

  @Get(":id/page-count")
  pageCount(
    @Req() request: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.resumes.getPageCount(ownerIdFor(request), id);
  }

  @Post(":id/export/:format")
  async export(
    @Req() request: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("format") format: string,
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (format !== "pdf" && format !== "docx")
      throw new BadRequestException("Unknown export format.");
    const { expectedRevision } = readBody(exportSchema, body);
    const { draft, layout, revision } = await this.resumes.getRenderSnapshot(
      ownerIdFor(request),
      id,
      expectedRevision,
    );
    response.setHeader("X-Ogma-Draft-Revision", revision);
    return exportResume(this.documents, draft, layout, format);
  }

  @Get(":id/thumbnail")
  @Header("Content-Type", "text/html; charset=utf-8")
  @Header(
    "Content-Security-Policy",
    "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; frame-ancestors 'self'; base-uri 'none'; form-action 'none'",
  )
  @Header("Referrer-Policy", "no-referrer")
  async thumbnail(
    @Req() request: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    const { draft, layout, revision } = await this.resumes.getRenderSnapshot(
      ownerIdFor(request),
      id,
    );
    const key = `${ownerIdFor(request)}:${id}:${revision}`;
    const cached = this.thumbnails.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.html;
    this.thumbnails.delete(key);
    const html = await this.documents.prepareHtml(
      renderResumeLayout(draft, layout, true),
      paginateResume,
    );
    if (Buffer.byteLength(html) <= 3_000_000) {
      this.thumbnails.set(key, { html, expiresAt: Date.now() + 300_000 });
      while (this.thumbnails.size > 4)
        this.thumbnails.delete(this.thumbnails.keys().next().value!);
    }
    return html;
  }

  @Patch(":id")
  save(
    @Req() request: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    const { expectedRevision, title, document } = readBody(saveSchema, body);
    return this.resumes.save(
      ownerIdFor(request),
      id,
      expectedRevision,
      title,
      document,
    );
  }

  @Post(":id/lock")
  setLocked(
    @Req() request: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    const parsed = readBody(lockSchema, body);
    return this.resumes.setLocked(
      ownerIdFor(request),
      id,
      parsed.expectedRevision,
      parsed.locked,
      parsed.locked
        ? undefined
        : { title: parsed.title, document: parsed.document },
    );
  }

  @Post(":id/duplicate")
  duplicate(
    @Req() request: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    const parsed = readBody(duplicateSchema, body);
    return this.resumes.duplicate(ownerIdFor(request), id, parsed.id);
  }

  @Post(":id/archive")
  archive(
    @Req() request: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    const { archived } = readBody(archiveSchema, body);
    return this.resumes.setArchived(ownerIdFor(request), id, archived);
  }

  @Delete(":id")
  @HttpCode(204)
  deleteArchived(
    @Req() request: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    const { expectedRevision } = readBody(exportSchema, body);
    return this.resumes.deleteArchived(
      ownerIdFor(request),
      id,
      expectedRevision,
    );
  }

  @Get(":id/checkpoints")
  listCheckpoints(
    @Req() request: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.checkpoints.list(ownerIdFor(request), id);
  }

  @Post(":id/checkpoints")
  saveCheckpoint(
    @Req() request: OwnerRequest,
    @Param("id", ParseUUIDPipe) resumeId: string,
    @Body() body: unknown,
  ) {
    const { id, name, expectedRevision } = readBody(newCheckpointSchema, body);
    return this.checkpoints.create(
      ownerIdFor(request),
      resumeId,
      id,
      name,
      expectedRevision,
    );
  }

  @Post(":id/checkpoints/:checkpointId/restore")
  restoreCheckpoint(
    @Req() request: OwnerRequest,
    @Param("id", ParseUUIDPipe) resumeId: string,
    @Param("checkpointId", ParseUUIDPipe) checkpointId: string,
    @Body() body: unknown,
  ) {
    const { id, expectedRevision } = readBody(restoreCheckpointSchema, body);
    return this.checkpoints.restore(
      ownerIdFor(request),
      resumeId,
      checkpointId,
      id,
      expectedRevision,
    );
  }
}
