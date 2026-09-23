/**
 * Dedicated utility to print ANY specific element (Voucher, Invoice, Confirmation)
 * directly on A4 paper with zero web page content or navigation artifacts.
 */
export function printElement(elementId: string, documentTitle = 'Sofia_Travel_Document'): void {
  const targetElement = document.getElementById(elementId);
  if (!targetElement) {
    console.error(`Print Error: Element #${elementId} not found. Falling back to window.print()`);
    window.print();
    return;
  }

  // Create an invisible iframe for complete document isolation
  const printIframe = document.createElement('iframe');
  printIframe.style.position = 'fixed';
  printIframe.style.right = '0';
  printIframe.style.bottom = '0';
  printIframe.style.width = '0';
  printIframe.style.height = '0';
  printIframe.style.border = '0';
  printIframe.title = documentTitle;

  document.body.appendChild(printIframe);

  const iframeDoc = printIframe.contentWindow?.document;
  if (!iframeDoc) {
    window.print();
    return;
  }

  // Collect all active document head styles (Tailwind CSS, fonts, root variables)
  const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(style => style.outerHTML)
    .join('\n');

  // Construct isolated HTML page with strict A4 page setup
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>${documentTitle}</title>
      ${headStyles}
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm 12mm 10mm 12mm;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          box-sizing: border-box !important;
        }
        html, body {
          background: #ffffff !important;
          color: #0f172a !important;
          width: 100% !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
        .printable-container {
          width: 100% !important;
          max-width: 190mm !important;
          margin: 0 auto !important;
          padding: 10px !important;
          background: #ffffff !important;
        }
        .print\\:hidden, button, .modal-toolbar {
          display: none !important;
        }
      </style>
    </head>
    <body>
      <div class="printable-container">
        ${targetElement.outerHTML}
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.focus();
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `);
  iframeDoc.close();

  // Clean up iframe after print dialog closes
  setTimeout(() => {
    try {
      document.body.removeChild(printIframe);
    } catch (e) {
      // Ignored if already removed
    }
  }, 3000);
}
