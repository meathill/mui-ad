/**
 * Load an image element from a blob/URL and resolve when ready.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

export interface PixelArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Crop a source image (by URL) to the given pixel area, returning a Blob.
 * Uses an offscreen canvas; stays purely in-browser.
 */
export async function cropImageToBlob(src: string, area: PixelArea, type = 'image/png'): Promise<Blob> {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = area.width;
  canvas.height = area.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2d context unavailable');
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob returned null'))), type);
  });
}

export function arrayBufferToBlob(bytes: ArrayBuffer, type: string): Blob {
  return new Blob([bytes], { type });
}
