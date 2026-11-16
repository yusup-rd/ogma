import { sampleResume } from "./sample-resume";

const escapedCharacters: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escapeText = (text: string) =>
  text.replace(/[&<>"']/g, (character) => escapedCharacters[character]);

export function renderSampleHtml(includeHighlights: boolean) {
  const pages = sampleResume.pages
    .map((blocks, index) => {
      const details =
        index === 0
          ? `<p class="role">${escapeText(sampleResume.title)}</p><p class="contact">${escapeText(sampleResume.contact)}</p>`
          : "";

      const content = blocks
        .map((block) => {
          const highlights = includeHighlights ? block.highlights : undefined;
          return `<section>
            <h2>${escapeText(block.heading)}</h2>
            ${block.detail ? `<h3>${escapeText(block.detail)}</h3>` : ""}
            ${(block.paragraphs ?? []).map((text) => `<p>${escapeText(text)}</p>`).join("")}
            ${highlights ? `<ul>${highlights.map((text) => `<li>${escapeText(text)}</li>`).join("")}</ul>` : ""}
          </section>`;
        })
        .join("");

      return `<article class="page" aria-label="Page ${index + 1}">
        <div class="sheet">
          ${index === 0 ? `<h1>${escapeText(sampleResume.name)}</h1>` : `<p class="continued">${escapeText(sampleResume.name)}</p>`}
          ${details}
          ${content}
          <p class="number">${index + 1}</p>
        </div>
      </article>`;
    })
    .join("");

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${escapeText(sampleResume.name)} · Sample resume</title>
      <style>
        * { box-sizing: border-box; }
        html { color-scheme: light; }
        body { margin: 0; background: #ece8e1; color: #252825; font-family: Arial, sans-serif; }
        main { padding: 20px 18px 36px; }
        .page { container-type: inline-size; margin: 0 auto 18px; width: min(100%, 458px); background: white; box-shadow: 0 2px 12px #2e25331a; }
        .sheet { position: relative; min-height: 141.42857cqw; padding: 8.57cqw; font-size: 2.4cqw; line-height: 1.46; }
        h1, h2, h3, p { margin: 0; }
        h1 { font-size: 7.35cqw; line-height: 1.12; letter-spacing: -.28cqw; }
        h2 { font-size: 2.33cqw; text-transform: uppercase; letter-spacing: .11cqw; margin-bottom: 1.6cqw; }
        h3 { font-size: 2.7cqw; margin-bottom: .6cqw; }
        .role { font-size: 3.29cqw; margin-top: 1.5cqw; }
        .contact { color: #555e58; border-bottom: 1px solid #e1dcd4; padding-bottom: 3.3cqw; margin-top: 1cqw; }
        .continued { font-weight: bold; font-size: 3cqw; }
        section { margin-top: 7.2cqw; }
        ul { margin: 2.9cqw 0 0; padding-left: 4cqw; }
        li + li { margin-top: 1.8cqw; }
        .number { position: absolute; right: 8.57cqw; bottom: 7cqw; color: #555e58; }
        @media print {
          @page { size: A4; margin: 0; }
          body { background: white; }
          main { padding: 0; }
          .page { width: 210mm; margin: 0; box-shadow: none; break-after: page; }
          .page:last-child { break-after: auto; }
          .sheet { min-height: 296mm; }
        }
      </style>
    </head>
    <body><main>${pages}</main></body>
  </html>`;
}
