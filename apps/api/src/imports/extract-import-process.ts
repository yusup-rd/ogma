import mammoth from "mammoth";
import { z } from "zod";

const maxTextLength = 200_000;

// Bound the declared expansion before handing an OOXML archive to Mammoth.
function validateWordArchive(buffer: Buffer) {
  let end = buffer.length - 22;
  const earliest = Math.max(0, end - 65_535);
  while (end >= earliest && buffer.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < earliest) throw new Error("Invalid archive");
  if (buffer.readUInt16LE(end + 4) || buffer.readUInt16LE(end + 6))
    throw new Error("Multipart archive");
  const count = buffer.readUInt16LE(end + 10);
  let offset = buffer.readUInt32LE(end + 16);
  let expanded = 0;
  let hasDocument = false;
  if (count > 1000) throw new Error("Too many archive entries");
  for (let index = 0; index < count; index++) {
    if (offset + 46 > end || buffer.readUInt32LE(offset) !== 0x02014b50)
      throw new Error("Invalid directory");
    if (buffer.readUInt16LE(offset + 8) & 1)
      throw new Error("Encrypted archive");
    expanded += buffer.readUInt32LE(offset + 24);
    if (expanded > 20 * 1024 * 1024) throw new Error("Archive too large");
    const nameLength = buffer.readUInt16LE(offset + 28);
    const next =
      offset +
      46 +
      nameLength +
      buffer.readUInt16LE(offset + 30) +
      buffer.readUInt16LE(offset + 32);
    if (next > end) throw new Error("Invalid entry");
    hasDocument ||=
      buffer.toString("utf8", offset + 46, offset + 46 + nameLength) ===
      "word/document.xml";
    offset = next;
  }
  if (!hasDocument) throw new Error("Missing Word document");
}

async function extract(input: { format: "pdf" | "docx"; base64: string }) {
  const bytes = Buffer.from(input.base64, "base64");
  if (input.format === "docx") {
    validateWordArchive(bytes);
    const result = await mammoth.extractRawText({ buffer: bytes });
    const html = await mammoth.convertToHtml(
      { buffer: bytes },
      { convertImage: mammoth.images.imgElement(async () => ({ src: "" })) },
    );
    const decode = (value: string) =>
      value.replace(
        /&(?:amp|quot|apos|lt|gt);/g,
        (entity) =>
          ({
            "&amp;": "&",
            "&quot;": '"',
            "&apos;": "'",
            "&lt;": "<",
            "&gt;": ">",
          })[entity] ?? entity,
      );
    const links = Array.from(
      html.value.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi),
      (match) => ({
        url: decode(match[1]),
        label: decode(match[2].replace(/<[^>]*>/g, "")),
        page: 1,
      }),
    );
    return {
      links,
      text: result.value,
      pageCount: null,
      warnings: result.messages.length
        ? ["Some Word content may require manual review."]
        : [],
    };
  }
  if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-")
    throw new Error("Invalid PDF");
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: false,
    verbosity: 0,
  });
  try {
    const document = await task.promise;
    if (document.numPages > 30) throw new Error("Too many pages");
    const pages: string[] = [];
    const links: { url: string; label: string; page: number }[] = [];
    let length = 0;
    for (let number = 1; number <= document.numPages; number++) {
      const page = await document.getPage(number);
      const content = await page.getTextContent();
      const annotations: unknown[] = await page.getAnnotations();
      for (const annotation of annotations) {
        const link = z
          .object({
            url: z.string().optional(),
            rect: z.array(z.number()).length(4).optional(),
          })
          .passthrough()
          .safeParse(annotation);
        if (!link.success || !link.data.url) continue;
        const rect = link.data.rect;
        const label = rect
          ? content.items
              .filter(
                (item) =>
                  "str" in item &&
                  item.transform[4] <= rect[2] &&
                  item.transform[4] + item.width >= rect[0] &&
                  item.transform[5] >= rect[1] - 3 &&
                  item.transform[5] <= rect[3] + 3,
              )
              .map((item) => ("str" in item ? item.str : ""))
              .join(" ")
          : "";
        links.push({ url: link.data.url, label, page: number });
      }
      const text = content.items
        .map((item) =>
          "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "",
        )
        .join("");
      length += text.length;
      if (length > maxTextLength) throw new Error("Too much text");
      pages.push(text);
      page.cleanup();
    }
    return {
      links,
      text: pages.join("\n\n"),
      pageCount: document.numPages,
      warnings: pages.some((page) => !page.trim())
        ? [
            "Some pages contain no extractable text. Add their content manually.",
          ]
        : [],
    };
  } finally {
    await task.destroy();
  }
}

process.once("message", (message: unknown) => {
  const input = z
    .object({ format: z.enum(["pdf", "docx"]), base64: z.string() })
    .parse(message);
  void extract(input)
    .then((result) => {
      const text = result.text.replaceAll(String.fromCharCode(0), "").trim();
      if (text.length > maxTextLength) throw new Error("Too much text");
      process.send?.({ ...result, text, requiresManualEntry: !text });
    })
    .catch(() => {
      // Parser errors can contain document text. Return only a fixed status.
      process.send?.({ error: true });
    });
});
