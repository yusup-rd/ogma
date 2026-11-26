import {
  BadRequestException,
  ServiceUnavailableException,
  Injectable,
} from "@nestjs/common";
import { join } from "node:path";
import { fork, type ChildProcess } from "node:child_process";
import { z } from "zod";

const uploadSchema = z.object({
  format: z.enum(["pdf", "docx"]),
  base64: z.string().min(4).max(1_398_104),
});
const extractionSchema = z.object({
  text: z.string().max(200_000),
  pageCount: z.number().int().positive().max(30).nullable(),
  warnings: z.array(z.string()),
  links: z.array(
    z.object({
      url: z.string(),
      label: z.string(),
      page: z.number().int().positive(),
    }),
  ),
  requiresManualEntry: z.boolean(),
});

@Injectable()
export class ImportExtractionService {
  private extracting = false;

  async extract(body: unknown) {
    const input = uploadSchema.safeParse(body);
    if (
      !input.success ||
      Buffer.from(input.data.base64, "base64").toString("base64") !==
        input.data.base64 ||
      Buffer.byteLength(input.data.base64, "base64") > 1024 * 1024
    ) {
      throw new BadRequestException("Choose a PDF or DOCX file up to 1 MB.");
    }
    if (this.extracting)
      throw new ServiceUnavailableException(
        "Another import is being read. Try again shortly.",
      );
    this.extracting = true;
    let parser: ChildProcess | undefined;
    let closed: Promise<void> | undefined;
    try {
      return await new Promise<z.infer<typeof extractionSchema>>(
        (resolve, reject) => {
          parser = fork(join(__dirname, "extract-import-process.js"), [], {
            execArgv: ["--max-old-space-size=128"],
            stdio: ["ignore", "ignore", "ignore", "ipc"],
          });
          closed = new Promise<void>((done) =>
            parser?.once("close", () => done()),
          );
          const timeout = setTimeout(() => {
            reject(
              new BadRequestException(
                "Reading this file timed out. Try a smaller file or enter its content manually.",
              ),
            );
            parser?.kill();
          }, 15_000);
          parser.once("message", (message: unknown) => {
            const result = extractionSchema.safeParse(message);
            if (result.success) resolve(result.data);
            else
              reject(
                new BadRequestException(
                  "This file could not be read. Choose an unencrypted PDF or DOCX, or enter its content manually.",
                ),
              );
            parser?.kill();
          });
          parser.once("error", () =>
            reject(
              new BadRequestException(
                "This file could not be read. Try another file or enter its content manually.",
              ),
            ),
          );
          parser.once("close", () => {
            clearTimeout(timeout);
            reject(
              new BadRequestException(
                "File extraction ended before completing.",
              ),
            );
          });
          parser.send(input.data);
        },
      );
    } finally {
      parser?.kill();
      await closed;
      this.extracting = false;
    }
  }
}
