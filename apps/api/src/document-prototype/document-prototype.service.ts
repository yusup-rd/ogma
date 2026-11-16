import {
  Injectable,
  OnModuleDestroy,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { setTimeout as wait } from "node:timers/promises";
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "playwright";
import { renderSampleHtml } from "./render-sample-html";
import { sampleResume } from "./sample-resume";

const maxDocumentPages = 2;
const renderTimeout = 20_000;

@Injectable()
export class DocumentPrototypeService implements OnModuleDestroy {
  private browser?: Promise<Browser>;
  private rendering = false;
  private activeDocumentPages = 0;

  constructor(private readonly config: ConfigService) {}

  async onModuleDestroy() {
    const browser = await this.browser?.catch(() => undefined);
    await browser?.close();
  }

  exportPdf(includeHighlights: boolean) {
    return this.printPdf(renderSampleHtml(includeHighlights));
  }

  async prepareHtml(html: string, prepare: (page: Page) => Promise<void>) {
    return this.withDocumentPage(html, async (page) => {
      await prepare(page);
      return page.content();
    });
  }

  async printPdf(html: string, prepare?: (page: Page) => Promise<void>) {
    if (this.rendering) {
      throw new ServiceUnavailableException(
        "A PDF is already being rendered. Try again shortly.",
      );
    }

    this.rendering = true;
    try {
      return await this.withDocumentPage(html, async (page) => {
        await prepare?.(page);
        return page.pdf({
          preferCSSPageSize: true,
          printBackground: true,
          tagged: true,
        });
      });
    } finally {
      this.rendering = false;
    }
  }

  private async withDocumentPage<T>(
    html: string,
    action: (page: Page) => Promise<T>,
  ) {
    if (this.activeDocumentPages >= maxDocumentPages) {
      throw new ServiceUnavailableException(
        "The document renderer is busy. Try again shortly.",
      );
    }

    this.activeDocumentPages++;
    try {
      const browserRequest = this.getBrowser();
      const browser = await browserRequest;
      const deadline = new AbortController();
      const timeoutError = new Error("Document rendering timed out.");
      const expired = wait(renderTimeout, undefined, {
        signal: deadline.signal,
      }).then(() => {
        throw timeoutError;
      });
      const contextRequest = browser.newContext({ offline: true });
      let context: BrowserContext | undefined;
      try {
        const render = async (context: BrowserContext) => {
          const page = await context.newPage();
          page.setDefaultTimeout(10_000);
          await page.setContent(html);
          return action(page);
        };
        context = await Promise.race([contextRequest, expired]);
        return await Promise.race([render(context), expired]);
      } catch (error) {
        if (error === timeoutError && !context) {
          if (this.browser === browserRequest) this.browser = undefined;
          try {
            await browser.close({ reason: timeoutError.message });
          } finally {
            // Context creation can finish while the browser is shutting down.
            const lateContext = await contextRequest.catch(() => undefined);
            await lateContext?.close();
          }
        }
        throw error;
      } finally {
        deadline.abort();
        // Closing the context interrupts any Playwright work still using its page.
        await context?.close();
      }
    } catch {
      throw new ServiceUnavailableException(
        "The document could not be rendered. Check that Chromium is installed and try again.",
      );
    } finally {
      this.activeDocumentPages--;
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
    if (this.browser) return this.browser;

    const browserRequest = chromium
      .launch({
        channel: this.config.get<string>("CHROMIUM_CHANNEL"),
        timeout: 10_000,
      })
      .then((browser) => {
        browser.once("disconnected", () => {
          if (this.browser === browserRequest) this.browser = undefined;
        });
        return browser;
      })
      .catch((error: unknown) => {
        if (this.browser === browserRequest) this.browser = undefined;
        throw error;
      });

    this.browser = browserRequest;
    return browserRequest;
  }
}
