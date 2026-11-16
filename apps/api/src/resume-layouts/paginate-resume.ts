import type { Page } from "playwright";

export async function paginateResume(page: Page) {
  await page.waitForFunction(() => document.fonts.status === "loaded");
  await page.evaluate(async () => {
    await Promise.all(
      Array.from(document.images, (image) =>
        image.decode().catch(() => undefined),
      ),
    );

    const workspace = document.querySelector<HTMLElement>(".workspace");
    const first = workspace?.querySelector<HTMLElement>(".page");
    const firstSheet = first?.querySelector<HTMLElement>(".resume-page");
    const firstColumns = firstSheet?.querySelector<HTMLElement>(".columns");
    if (!workspace || !first || !firstSheet || !firstColumns) return;

    // Measure at print size. The iframe can scale the resulting pages independently.
    const printWidth =
      ((Number(workspace.dataset.paperWidth) || 210) * 96) / 25.4;
    const printHeight =
      (((Number(workspace.dataset.paperHeight) || 297) - 1) * 96) / 25.4;
    const measure = document.createElement("style");
    measure.textContent = `.workspace{padding:0}.workspace > .page{width:${printWidth}px !important}`;
    document.head.append(measure);
    const sourceColumns = Array.from(firstColumns.children);
    const sources = sourceColumns.map((column) => {
      const sections = Array.from(
        column.querySelectorAll<HTMLElement>(
          ":scope > section:has(> .section-copy)",
        ),
      );
      sections.forEach((section) => section.remove());
      return sections;
    });

    function continuation() {
      const wrapper = first!.cloneNode(false) as HTMLElement;
      const sheet = firstSheet!.cloneNode(false) as HTMLElement;
      const columns = firstColumns!.cloneNode(false) as HTMLElement;
      columns.append(...sourceColumns.map((column) => column.cloneNode(false)));
      sheet.append(columns);
      wrapper.append(sheet);
      workspace!.append(wrapper);
      return { sheet, columns };
    }

    const pages = [{ sheet: firstSheet, columns: firstColumns }];
    function pageAt(index: number) {
      return pages[index] ?? (pages[index] = continuation());
    }

    function textPositions(element: HTMLElement) {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const positions: { index: number; offset: number }[] = [];
      let index = 0;
      for (
        let node = walker.nextNode();
        node;
        node = walker.nextNode(), index++
      ) {
        if (node.parentElement?.closest(".project-table thead")) continue;
        const text = node.textContent ?? "";
        let lastBreak = 0;
        for (let offset = 1; offset <= text.length; offset++) {
          if (
            /\s/.test(text[offset - 1]) ||
            offset - lastBreak >= 80 ||
            offset === text.length
          ) {
            positions.push({ index, offset });
            lastBreak = offset;
          }
        }
      }
      return positions.slice(0, -1);
    }

    function fragment(
      element: HTMLElement,
      position: { index: number; offset: number },
      side: "before" | "after",
    ) {
      const clone = element.cloneNode(true) as HTMLElement;
      const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      for (let index = 0; index < position.index; index++)
        node = walker.nextNode();
      if (!node) return clone;
      const range = document.createRange();
      if (side === "before") {
        range.setStart(node, position.offset);
        range.setEnd(clone, clone.childNodes.length);
      } else {
        range.setStart(clone, 0);
        range.setEnd(node, position.offset);
        for (
          let parent = node.parentElement;
          parent && parent !== clone;
          parent = parent.parentElement
        ) {
          if (
            parent instanceof HTMLLIElement &&
            parent.parentElement instanceof HTMLOListElement
          ) {
            const list = parent.parentElement;
            list.start += [...list.children].indexOf(parent);
          }
        }
      }
      range.deleteContents();
      const tableIn = (root: HTMLElement) =>
        root.matches(".project-table")
          ? root
          : root.querySelector(".project-table");
      const table = tableIn(clone);
      if (table) {
        const rows = [...table.querySelectorAll("tbody tr")];
        rows
          .filter((row) => !row.textContent.trim())
          .forEach((row) => row.remove());
        if (!table.querySelector("tbody tr")) {
          if (table !== clone) table.remove();
        } else if (side === "after" && !table.querySelector("thead")) {
          const heading = tableIn(element)?.querySelector("thead");
          if (heading) table.prepend(heading.cloneNode(true));
        }
      }
      return clone;
    }

    for (const [columnIndex, sections] of sources.entries()) {
      let pageIndex = 0;
      for (const source of sections) {
        const sectionContent =
          source.querySelector<HTMLElement>(".section-copy")!;
        let currentSection: HTMLElement | undefined;
        let target: HTMLElement | undefined;
        function getTarget() {
          if (target) return target;
          currentSection = source.cloneNode(false) as HTMLElement;
          target = sectionContent.cloneNode(false) as HTMLElement;
          currentSection.append(
            source.firstElementChild!.cloneNode(true),
            target,
          );
          pageAt(pageIndex).columns.children[columnIndex].append(
            currentSection,
          );
          return target;
        }
        function fits(box: HTMLElement) {
          const { sheet } = pageAt(pageIndex);
          const pageTop = sheet.getBoundingClientRect().top;
          const bottomPadding = parseFloat(
            getComputedStyle(sheet).paddingBottom,
          );
          return (
            box.getBoundingClientRect().bottom <=
            pageTop + printHeight - bottomPadding
          );
        }
        function nextPage() {
          if (target && !target.children.length) currentSection?.remove();
          target = undefined;
          currentSection = undefined;
          pageIndex++;
        }

        for (const item of Array.from(sectionContent.children)) {
          let pending: HTMLElement | undefined = item as HTMLElement;
          while (pending) {
            const box = getTarget();
            box.append(pending);
            if (fits(box)) break;
            pending.remove();
            const { sheet, columns } = pageAt(pageIndex);
            const column = columns.children[columnIndex];
            const used =
              box.children.length > 0 ||
              column.children.length > 1 ||
              (pageIndex === 0 &&
                sheet.querySelector("header, .rail-portrait"));
            if (used) {
              nextPage();
              continue;
            }

            const positions = textPositions(pending);
            let low = 0;
            let high = positions.length - 1;
            while (low <= high) {
              const mid = Math.floor((low + high) / 2);
              const candidate = fragment(pending, positions[mid], "before");
              box.append(candidate);
              const fitsPage = fits(box);
              candidate.remove();
              if (fitsPage) low = mid + 1;
              else high = mid - 1;
            }
            if (high < 0) {
              box.append(pending);
              break;
            }
            box.append(fragment(pending, positions[high], "before"));
            pending = fragment(pending, positions[high], "after");
            nextPage();
          }
        }
      }
    }

    workspace.dataset.pageCount = String(pages.length);
    measure.remove();
  });
}
