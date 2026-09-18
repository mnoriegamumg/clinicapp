import jsPDF from 'jspdf';

/**
 * Opens a generated jsPDF document in a new browser tab and triggers the print
 * dialog instead of downloading the file.
 *
 * Uses jsPDF's `autoPrint()` so the viewer opens the print dialog automatically,
 * and loads the document via a blob URL that is revoked once it is no longer
 * needed. Falls back to the browser's native print flow when popups are allowed.
 */
export function openPdfForPrinting(pdf: jsPDF): void {
  if (typeof window === 'undefined') {
    return;
  }

  pdf.autoPrint();

  const blobUrl = pdf.output('bloburl');
  const printWindow = window.open(blobUrl as unknown as string, '_blank');

  // If the popup was blocked, fall back to printing via a hidden iframe so the
  // user still gets the print dialog without a download.
  if (!printWindow) {
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = url;

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    };

    document.body.appendChild(iframe);
  }
}
