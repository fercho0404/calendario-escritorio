import { PAGE_H_MM, PAGE_W_MM } from './models';


/**
 * Exporta cada elemento (una página de 21 x 15 cm) a una hoja del PDF.
 * Las librerías se cargan bajo demanda para no inflar la carga inicial.
 */
export async function exportPagesToPdf(
  pages: HTMLElement[],
  fileName: string,
  scale: number,
  fonts: { main: string; script: string; cover: string },
  onProgress: (done: number, total: number) => void,
): Promise<void> {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas-pro')]);
  const specs = [
    ...[300, 400, 500, 600].map((w) => `${w} 20px "${fonts.main}"`),
    `400 20px "${fonts.script}"`,
    `400 20px "${fonts.cover}"`,
  ];
  await Promise.all(specs.map((f) => document.fonts.load(f).catch(() => [])));
  await document.fonts.ready;

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [PAGE_W_MM, PAGE_H_MM], compress: true });
  for (let i = 0; i < pages.length; i++) {
    onProgress(i, pages.length);
    const canvas = await html2canvas(pages[i], {
      scale,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });
    if (i > 0) pdf.addPage([PAGE_W_MM, PAGE_H_MM], 'landscape');
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, PAGE_W_MM, PAGE_H_MM, undefined, 'FAST');
    // Cede el hilo para que la interfaz muestre el progreso.
    await new Promise((r) => setTimeout(r, 0));
  }
  onProgress(pages.length, pages.length);
  pdf.save(fileName);
}
