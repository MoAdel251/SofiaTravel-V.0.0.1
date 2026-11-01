import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

export interface PDFExportOptions {
  filename?: string;
  elementId: string;
  title?: string;
  /** Optional caption printed in the footer of every page (e.g. invoice number). */
  footerText?: string;
}

/**
 * A4 geometry.
 *
 * The document is laid out in CSS pixels at the browser's 96 dpi reference
 * resolution. Keeping the layout width equal to the printable width of an A4
 * page means 1 CSS pixel maps to exactly 1/96 inch on paper, so the rasterised
 * pages keep their natural physical size (no shrinking, no clipping).
 */
const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const PAGE_MARGIN_MM = 8;
const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - PAGE_MARGIN_MM * 2;
const CONTENT_HEIGHT_MM = PAGE_HEIGHT_MM - PAGE_MARGIN_MM * 2;
const PX_PER_MM = 96 / 25.4;
const CONTENT_WIDTH_PX = Math.floor(CONTENT_WIDTH_MM * PX_PER_MM);
const CONTENT_HEIGHT_PX = Math.floor(CONTENT_HEIGHT_MM * PX_PER_MM);
const LAYOUT_TOLERANCE_PX = 1;

const isOverPage = (element: HTMLElement): boolean =>
  element.getBoundingClientRect().height > CONTENT_HEIGHT_PX + LAYOUT_TOLERANCE_PX;

/** Copy the rendered column widths of the first table chunk onto the next ones. */
function measureColumnWidths(table: HTMLTableElement): number[] {
  const headerRow = table.tHead?.rows[0];
  if (!headerRow) return [];
  return Array.from(headerRow.cells).map(cell => cell.getBoundingClientRect().width);
}

function applyColumnWidths(table: HTMLTableElement, widths: number[]): void {
  if (!widths.length) return;
  const total = widths.reduce((sum, width) => sum + width, 0);
  if (!total) return;
  table.style.tableLayout = 'fixed';
  table.style.width = '100%';
  Array.from(table.tHead?.rows[0]?.cells || []).forEach((cell, index) => {
    if (index >= widths.length) return;
    (cell as HTMLElement).style.width = `${(widths[index] / total) * 100}%`;
  });
}

/**
 * Lay the printable element out over as many A4 pages as it needs.
 *
 * The source element is cloned into an off-screen A4-width stage and its
 * content flows page by page. Table rows are placed one at a time so a row is
 * never cut in half, and the table header is repeated on every continuation
 * page. Nothing is scaled down: when the content does not fit, a new page is
 * started, which guarantees every item remains readable.
 */
function layOutPages(source: HTMLElement): { stage: HTMLElement; pages: HTMLElement[] } {
  const stage = document.createElement('div');
  stage.setAttribute('aria-hidden', 'true');
  stage.style.cssText = [
    'position:fixed',
    'top:0',
    'left:-20000px',
    `width:${CONTENT_WIDTH_PX}px`,
    'background:#ffffff',
    'color:#0f172a',
    'pointer-events:none',
    'z-index:-1',
  ].join(';');

  const template = source.cloneNode(true) as HTMLElement;
  template.removeAttribute('id');
  // Preserve the writing direction of the on-screen document (Arabic UI).
  try {
    const direction = getComputedStyle(source).direction;
    if (direction) template.setAttribute('dir', direction);
  } catch {
    // Ignore — the document will simply inherit the page direction.
  }
  template.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
  template.classList.remove('avoid-page-break', 'printable-a4');
  template.style.width = `${CONTENT_WIDTH_PX}px`;
  template.style.maxWidth = 'none';
  template.style.maxHeight = 'none';
  template.style.overflow = 'visible';
  template.style.boxShadow = 'none';
  template.style.border = 'none';
  template.style.background = '#ffffff';
  (template.style as CSSStyleDeclaration & { printColorAdjust?: string }).printColorAdjust = 'exact';
  template.querySelectorAll('[data-pdf-exclude]').forEach(node => node.remove());

  document.body.appendChild(stage);

  const pages: HTMLElement[] = [];
  const newPage = (): HTMLElement => {
    const page = template.cloneNode(false) as HTMLElement;
    page.style.width = `${CONTENT_WIDTH_PX}px`;
    page.style.boxSizing = 'border-box';
    stage.appendChild(page);
    pages.push(page);
    return page;
  };

  let page = newPage();

  /** Height of a block as it would appear at the top of an empty page. */
  const measureOnFreshPage = (block: HTMLElement): number => {
    const probe = template.cloneNode(false) as HTMLElement;
    probe.style.width = `${CONTENT_WIDTH_PX}px`;
    probe.style.boxSizing = 'border-box';
    stage.appendChild(probe);
    probe.appendChild(block);
    const height = probe.scrollHeight;
    probe.removeChild(block);
    probe.remove();
    return height;
  };

  /** Append a block; roll back when it would overflow the page. */
  const tryPlace = (block: HTMLElement): boolean => {
    page.appendChild(block);
    if (!isOverPage(page)) return true;
    page.removeChild(block);
    return false;
  };

  /**
   * Flow an over-sized table across pages row by row, repeating the header and
   * the table's card styling on every page while keeping column widths stable.
   */
  const flowTable = (wrapper: HTMLElement, table: HTMLTableElement): void => {
    const body = table.tBodies[0];
    if (!body) {
      page.appendChild(wrapper);
      return;
    }
    const rows = Array.from(body.rows);
    let columnWidths: number[] = [];
    let index = 0;

    while (index < rows.length) {
      const chunk = wrapper.cloneNode(true) as HTMLElement;
      const chunkTable = (chunk.matches('table') ? chunk : chunk.querySelector('table')) as HTMLTableElement;
      const chunkBody = chunkTable?.tBodies[0];
      if (!chunkBody) {
        page.appendChild(chunk);
        return;
      }
      while (chunkBody.rows.length) chunkBody.deleteRow(0);
      if (columnWidths.length) applyColumnWidths(chunkTable, columnWidths);

      page.appendChild(chunk);

      let placedRows = 0;
      while (index < rows.length) {
        const row = rows[index].cloneNode(true) as HTMLTableRowElement;
        chunkBody.appendChild(row);
        if (isOverPage(page)) {
          chunkBody.removeChild(row);
          break;
        }
        index += 1;
        placedRows += 1;
        if (!columnWidths.length) {
          columnWidths = measureColumnWidths(chunkTable);
          if (columnWidths.length) {
            // Keep the rows already placed in this chunk aligned with the
            // measured column widths.
            applyColumnWidths(chunkTable, columnWidths);
          }
        }
      }

      if (placedRows === 0) {
        if (page.children.length > 1) {
          // The remaining rows do not fit under the blocks already on this
          // page, so retry on a fresh page.
          page.removeChild(chunk);
          page = newPage();
          continue;
        }
        // A single row is taller than a page: place it and move on so no data
        // is ever dropped.
        chunkBody.appendChild(rows[index].cloneNode(true));
        index += 1;
      }

      if (index < rows.length) page = newPage();
    }
  };

  /** Generic fallback: flow the children of an over-sized block across pages. */
  const flowChildren = (block: HTMLElement): void => {
    let shell = block.cloneNode(false) as HTMLElement;
    page.appendChild(shell);
    for (const child of Array.from(block.children) as HTMLElement[]) {
      const clone = child.cloneNode(true) as HTMLElement;
      shell.appendChild(clone);
      if (!isOverPage(page)) continue;
      shell.removeChild(clone);
      if (!shell.children.length) {
        // Not even one child fits a full page; keep it rather than lose data.
        shell.appendChild(clone);
        continue;
      }
      page = newPage();
      shell = block.cloneNode(false) as HTMLElement;
      page.appendChild(shell);
      shell.appendChild(clone);
    }
  };

  const placeBlock = (block: HTMLElement): void => {
    if (tryPlace(block)) return;

    const table = (block.matches('table') ? block : block.querySelector('table')) as HTMLTableElement | null;
    const canFlowTable = Boolean(table && table.tBodies.length && table.tBodies[0].rows.length);

    // A block that still fits on an empty page simply moves to the next page.
    if (measureOnFreshPage(block) <= CONTENT_HEIGHT_PX) {
      if (page.children.length > 0) page = newPage();
      page.appendChild(block);
      return;
    }

    // Taller than a whole page: start splitting right here so the remaining
    // space on the current page is used instead of being left blank.
    if (canFlowTable && table) {
      flowTable(block, table);
      return;
    }
    if (block.children.length > 1) {
      flowChildren(block);
      return;
    }
    // Unbreakable single block: place it so its content is never silently lost.
    if (page.children.length > 0) page = newPage();
    page.appendChild(block);
  };

  for (const block of Array.from(template.children) as HTMLElement[]) {
    placeBlock(block);
  }

  // Drop trailing pages that ended up empty.
  while (pages.length > 1 && pages[pages.length - 1].children.length === 0) {
    const empty = pages.pop()!;
    empty.remove();
  }

  return { stage, pages };
}

async function waitForFonts(): Promise<void> {
  try {
    await (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready;
  } catch {
    // Font loading is best-effort.
  }
}

async function waitForImages(pages: HTMLElement[]): Promise<void> {
  const images = pages.flatMap(page => Array.from(page.querySelectorAll('img')));
  await Promise.all(
    images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>(resolve => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => resolve(), { once: true });
        setTimeout(resolve, 4000);
      });
    })
  );
}

/**
 * Render an HTML element to a multi-page A4 PDF.
 *
 * Every page is rasterised independently at A4 width, so long invoices keep
 * their original type size and simply continue on the next page.
 */
async function renderElementToPDF(
  source: HTMLElement,
  options: { title?: string; footerText?: string }
): Promise<jsPDF> {
  // Fonts must be ready before measuring, otherwise page breaks can drift.
  await waitForFonts();
  const { stage, pages } = layOutPages(source);

  try {
    await waitForImages(pages);

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
    if (options.title) {
      pdf.setProperties({ title: options.title });
    }

    for (let index = 0; index < pages.length; index += 1) {
      const pageElement = pages[index];
      const canvas = await html2canvas(pageElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        windowWidth: document.documentElement.clientWidth,
        windowHeight: document.documentElement.clientHeight,
      });

      let imageWidthMm = CONTENT_WIDTH_MM;
      let imageHeightMm = (canvas.height / canvas.width) * imageWidthMm;
      if (imageHeightMm > CONTENT_HEIGHT_MM) {
        const factor = CONTENT_HEIGHT_MM / imageHeightMm;
        imageWidthMm *= factor;
        imageHeightMm *= factor;
      }

      if (index > 0) pdf.addPage();
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.95),
        'JPEG',
        PAGE_MARGIN_MM,
        PAGE_MARGIN_MM,
        imageWidthMm,
        imageHeightMm,
        undefined,
        'FAST'
      );

      if (pages.length > 1) {
        pdf.setFontSize(7.5);
        pdf.setTextColor(120, 130, 145);
        if (options.footerText) {
          pdf.text(options.footerText, PAGE_MARGIN_MM, PAGE_HEIGHT_MM - 3.5);
        }
        pdf.text(
          `Page ${index + 1} / ${pages.length}`,
          PAGE_WIDTH_MM - PAGE_MARGIN_MM,
          PAGE_HEIGHT_MM - 3.5,
          { align: 'right' }
        );
      }
    }

    return pdf;
  } finally {
    stage.remove();
  }
}

/**
 * Download any DOM element as a crisp, multi-page A4 PDF file.
 */
export async function downloadElementAsPDF({
  elementId,
  filename = 'Sofia_Travel_Document.pdf',
  title,
  footerText,
}: PDFExportOptions): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`PDF Generation Error: Element with ID #${elementId} not found.`);
    window.print();
    return;
  }

  try {
    const pdf = await renderElementToPDF(element, { title, footerText });
    pdf.save(filename);
  } catch (error) {
    console.warn('PDF generation failed, falling back to the browser print dialog:', error);
    window.print();
  }
}
