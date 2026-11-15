import {
  Injectable,
  OnModuleDestroy,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { chromium, type Browser } from "playwright";
import { renderSampleHtml } from "./render-sample-html";
import { sampleResume } from "./sample-resume";

@Injectable()
export class DocumentPrototypeService implements OnModuleDestroy {
  private browser?: Promise<Browser>;
  private rendering = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleDestroy() {
    const browser = await this.browser?.catch(() => undefined);
    await browser?.close();
  }

  async exportPdf(includeHighlights: boolean) {
    if (this.rendering) {
      throw new ServiceUnavailableException(
        "A sample PDF is already being rendered. Try again shortly.",
      );
    }

    this.rendering = true;

    try {
      const browser = await this.getBrowser();
      const context = await browser.newContext({ offline: true });
      try {
        const page = await context.newPage();
        page.setDefaultTimeout(10_000);
        await page.setContent(renderSampleHtml(includeHighlights), {});
        return await page.pdf({
          preferCSSPageSize: true,
          printBackground: true,
          tagged: true,
        });
      } finally {
        await context.close();
      }
    } catch {
      throw new ServiceUnavailableException(
        "Sample PDF rendering is unavailable. Check that Chromium is installed.",
      );
    } finally {
      this.rendering = false;
    }
  }

  async exportDocx(includeHighlights: boolean) {
    const margin = 1020;
    const doc = new Document({
      title: sampleResume.name + " · Sample resume",
      styles: {
        default: { document: { run: { font: "Arial", size: 22 } } },
      },
      sections: [
        {
          properties: {
            page: {
              size: { width: 11906, height: 16838 },
              margin: {
                top: margin,
                right: margin,
                bottom: margin,
                left: margin,
              },
            },
          },
          children: sampleResume.pages.flatMap((blocks, index) => [
            new Paragraph({
              text: sampleResume.name,
              heading: HeadingLevel.TITLE,
              pageBreakBefore: index > 0,
            }),
            ...(index === 0
              ? [
                  new Paragraph(sampleResume.title),
                  new Paragraph(sampleResume.contact),
                ]
              : []),
            ...blocks.flatMap((block) => [
              new Paragraph({
                text: block.heading,
                heading: HeadingLevel.HEADING_1,
                keepNext: true,
              }),
              ...(block.detail
                ? [
                    new Paragraph({
                      children: [
                        new TextRun({ text: block.detail, bold: true }),
                      ],
                      keepNext: true,
                    }),
                  ]
                : []),
              ...(block.paragraphs ?? []).map((text) => new Paragraph(text)),
              ...(includeHighlights ? (block.highlights ?? []) : []).map(
                (text) => new Paragraph({ text, bullet: { level: 0 } }),
              ),
            ]),
          ]),
        },
      ],
    });

    return Packer.toBuffer(doc);
  }

  private getBrowser() {
    this.browser ??= chromium
      .launch({
        channel: this.config.get<string>("CHROMIUM_CHANNEL"),
        timeout: 10_000,
      })
      .then((browser) => {
        browser.once("disconnected", () => {
          this.browser = undefined;
        });
        return browser;
      })
      .catch((error: unknown) => {
        this.browser = undefined;
        throw error;
      });

    return this.browser;
  }
}
