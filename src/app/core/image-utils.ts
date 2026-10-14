import { Photo } from './models';

const MAX_SIDE = 1600;

/** Lee una imagen, la reduce a un tamaño razonable para impresión y la devuelve como Photo. */
export async function fileToPhoto(file: File, maxSide = MAX_SIDE): Promise<Photo> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('No se pudo leer la imagen'));
      el.src = url;
    });
    const ratio = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * ratio);
    const h = Math.round(img.naturalHeight * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return { src: canvas.toDataURL('image/jpeg', 0.9), w, h, zoom: 1, x: 50, y: 50 };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Estilo de fondo que emula object-fit: cover con zoom y punto focal.
 * Se usa background-image (y no <img>) porque se exporta fielmente a PDF.
 */
export function photoBackground(photo: Photo, boxAspect: number): Record<string, string> {
  const imgAspect = photo.w / photo.h;
  const widthPct = photo.zoom * Math.max(imgAspect / boxAspect, 1) * 100;
  return {
    'background-image': `url(${photo.src})`,
    'background-size': `${widthPct.toFixed(3)}% auto`,
    'background-position': `${photo.x}% ${photo.y}%`,
    'background-repeat': 'no-repeat',
  };
}

export function downloadText(filename: string, content: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
