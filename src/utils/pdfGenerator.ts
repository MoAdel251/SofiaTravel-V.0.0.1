// @ts-ignore
import html2pdf from 'html2pdf.js';

export interface PDFExportOptions {
  filename?: string;
  elementId: string;
  title?: string;
}

/**
 * Utility to download any DOM element as a crisp, A4-formatted PDF file.
 */
export async function downloadElementAsPDF({ elementId, filename = 'Sofia_Travel_Document.pdf' }: PDFExportOptions): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`PDF Generation Error: Element with ID #${elementId} not found.`);
    // Fallback to browser window print
    window.print();
    return;
  }

  // Configure html2pdf options for exact A4 sheet scaling
  const opt: any = {
    margin: [8, 8, 8, 8], // 8mm margins around page
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2, // High DPI for crisp vector text and sharp logo rendering
      useCORS: true,
      logging: false,
      letterRendering: true,
      windowWidth: 800
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait',
      compress: true
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  try {
    // Generate and trigger native browser file download
    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.warn('html2pdf generation encountered issue, falling back to window.print():', error);
    window.print();
  }
}
