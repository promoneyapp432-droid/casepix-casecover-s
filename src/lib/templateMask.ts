export interface TemplateMaskBounds {
  mask_x: number;
  mask_y: number;
  mask_width: number;
  mask_height: number;
}

const DEFAULT_MASK: TemplateMaskBounds = {
  mask_x: 20,
  mask_y: 15,
  mask_width: 60,
  mask_height: 70,
};

const TRANSPARENT_THRESHOLD = 128;
const MIN_COMPONENT_AREA_RATIO = 0.01;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const toPercent = (value: number) => Number(clamp(value, 0, 100).toFixed(2));

const isTransparentPixel = (_r: number, _g: number, _b: number, a: number) => {
  return a < TRANSPARENT_THRESHOLD;
};

export const detectMaskFromTemplateImage = async (imageUrl: string): Promise<TemplateMaskBounds> => {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = 'anonymous';
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to load template image'));
      el.src = imageUrl;
    });

    const maxDimension = 800;
    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return DEFAULT_MASK;

    ctx.drawImage(img, 0, 0, width, height);

    const { data } = ctx.getImageData(0, 0, width, height);
    const visited = new Uint8Array(width * height);

    let bestArea = 0;
    let bestBounds: { minX: number; minY: number; maxX: number; maxY: number } | null = null;

    const stack: number[] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (visited[idx]) continue;

        const pixelIndex = idx * 4;
        if (!isWhitePixel(data[pixelIndex], data[pixelIndex + 1], data[pixelIndex + 2], data[pixelIndex + 3])) {
          visited[idx] = 1;
          continue;
        }

        let area = 0;
        let minX = x;
        let minY = y;
        let maxX = x;
        let maxY = y;

        stack.push(idx);
        visited[idx] = 1;

        while (stack.length > 0) {
          const current = stack.pop()!;
          const cx = current % width;
          const cy = Math.floor(current / width);

          area++;
          if (cx < minX) minX = cx;
          if (cy < minY) minY = cy;
          if (cx > maxX) maxX = cx;
          if (cy > maxY) maxY = cy;

          const neighbors = [
            current - 1,
            current + 1,
            current - width,
            current + width,
          ];

          for (const next of neighbors) {
            if (next < 0 || next >= visited.length || visited[next]) continue;

            const nx = next % width;
            const ny = Math.floor(next / width);

            if (Math.abs(nx - cx) + Math.abs(ny - cy) !== 1) continue;

            const nextPixel = next * 4;
            if (isWhitePixel(data[nextPixel], data[nextPixel + 1], data[nextPixel + 2], data[nextPixel + 3])) {
              visited[next] = 1;
              stack.push(next);
            } else {
              visited[next] = 1;
            }
          }
        }

        if (area > bestArea) {
          bestArea = area;
          bestBounds = { minX, minY, maxX, maxY };
        }
      }
    }

    if (!bestBounds) return DEFAULT_MASK;

    const minArea = width * height * MIN_COMPONENT_AREA_RATIO;
    if (bestArea < minArea) return DEFAULT_MASK;

    const maskX = (bestBounds.minX / width) * 100;
    const maskY = (bestBounds.minY / height) * 100;
    const maskWidth = ((bestBounds.maxX - bestBounds.minX + 1) / width) * 100;
    const maskHeight = ((bestBounds.maxY - bestBounds.minY + 1) / height) * 100;

    return {
      mask_x: toPercent(maskX),
      mask_y: toPercent(maskY),
      mask_width: toPercent(maskWidth),
      mask_height: toPercent(maskHeight),
    };
  } catch {
    return DEFAULT_MASK;
  }
};

export const getDefaultTemplateMask = (): TemplateMaskBounds => ({ ...DEFAULT_MASK });
