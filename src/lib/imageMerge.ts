/**
 * Pixel-based image merging: detects the white area of a phone case template
 * (even in 3D/perspective view) and composites the design image into exactly
 * that shape, then overlays the template frame on top.
 */

const TRANSPARENT_THRESHOLD = 128;

const isTransparentPixel = (_r: number, _g: number, _b: number, a: number): boolean => {
  return a < TRANSPARENT_THRESHOLD;
};

/**
 * Flood-fill from all white pixels to find the largest connected white region.
 * Returns a boolean mask of pixels belonging to that region.
 */
const findLargestWhiteRegion = (
  data: Uint8ClampedArray,
  width: number,
  height: number
): { mask: Uint8Array; minX: number; minY: number; maxX: number; maxY: number } | null => {
  const totalPixels = width * height;
  const visited = new Uint8Array(totalPixels);
  const stack: number[] = [];

  let bestMask: Uint8Array | null = null;
  let bestArea = 0;
  let bestBounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (visited[idx]) continue;

      const pi = idx * 4;
      if (!isTransparentPixel(data[pi], data[pi + 1], data[pi + 2], data[pi + 3])) {
        visited[idx] = 1;
        continue;
      }

      // BFS/DFS flood fill for this white connected component
      const componentMask = new Uint8Array(totalPixels);
      let area = 0;
      let cMinX = x, cMinY = y, cMaxX = x, cMaxY = y;

      stack.push(idx);
      visited[idx] = 1;

      while (stack.length > 0) {
        const current = stack.pop()!;
        const cx = current % width;
        const cy = Math.floor(current / width);

        componentMask[current] = 1;
        area++;
        if (cx < cMinX) cMinX = cx;
        if (cy < cMinY) cMinY = cy;
        if (cx > cMaxX) cMaxX = cx;
        if (cy > cMaxY) cMaxY = cy;

        // 4-connected neighbors
        const neighbors = [current - 1, current + 1, current - width, current + width];
        for (const next of neighbors) {
          if (next < 0 || next >= totalPixels || visited[next]) continue;
          const nx = next % width;
          const ny = Math.floor(next / width);
          if (Math.abs(nx - cx) + Math.abs(ny - cy) !== 1) continue;

          visited[next] = 1;
          const npi = next * 4;
          if (isTransparentPixel(data[npi], data[npi + 1], data[npi + 2], data[npi + 3])) {
            stack.push(next);
          }
        }
      }

      if (area > bestArea) {
        bestArea = area;
        bestMask = componentMask;
        bestBounds = { minX: cMinX, minY: cMinY, maxX: cMaxX, maxY: cMaxY };
      }
    }
  }

  const minArea = width * height * 0.005;
  if (!bestMask || bestArea < minArea) return null;

  return { mask: bestMask, ...bestBounds };
};

/**
 * Merges a design image into a phone case template using pixel-level masking.
 * 
 * 1. Detects the largest white region in the template (supports 3D/perspective shapes)
 * 2. Draws the design image scaled to cover the bounding box of that region
 * 3. Clips the design to only the exact white pixel shape
 * 4. Overlays the template with white pixels made transparent
 * 
 * Result: design visible through the exact perspective shape, case frame on top.
 */
export const mergeDesignWithTemplate = (
  designImg: HTMLImageElement,
  templateImg: HTMLImageElement,
  canvas?: HTMLCanvasElement,
): string => {
  const cvs = canvas || document.createElement('canvas');
  const ctx = cvs.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas context not available');

  cvs.width = templateImg.width;
  cvs.height = templateImg.height;
  const W = cvs.width;
  const H = cvs.height;

  // Step 1: Draw template and analyze pixels
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(templateImg, 0, 0);
  const templateData = ctx.getImageData(0, 0, W, H);

  const region = findLargestWhiteRegion(templateData.data, W, H);
  if (!region) {
    // Fallback: just overlay
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(designImg, 0, 0, W, H);
    ctx.drawImage(templateImg, 0, 0);
    return cvs.toDataURL('image/png');
  }

  const { mask, minX, minY, maxX, maxY } = region;
  const maskW = maxX - minX + 1;
  const maskH = maxY - minY + 1;

  // Step 2: Draw design scaled to cover the white region's bounding box
  ctx.clearRect(0, 0, W, H);

  const designAspect = designImg.width / designImg.height;
  const regionAspect = maskW / maskH;
  let srcX = 0, srcY = 0, srcW = designImg.width, srcH = designImg.height;

  if (designAspect > regionAspect) {
    srcW = designImg.height * regionAspect;
    srcX = (designImg.width - srcW) / 2;
  } else {
    srcH = designImg.width / regionAspect;
    srcY = (designImg.height - srcH) / 2;
  }

  ctx.drawImage(designImg, srcX, srcY, srcW, srcH, minX, minY, maskW, maskH);

  // Step 3: Clip design to only the white pixel shape
  const designData = ctx.getImageData(0, 0, W, H);
  const dPixels = designData.data;

  for (let i = 0; i < W * H; i++) {
    if (!mask[i]) {
      const pi = i * 4;
      dPixels[pi + 3] = 0; // Make transparent where template wasn't white
    }
  }
  ctx.putImageData(designData, 0, 0);

  // Step 4: Create modified template with white area made transparent, draw on top
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = W;
  tempCanvas.height = H;
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.drawImage(templateImg, 0, 0);
  const tData = tempCtx.getImageData(0, 0, W, H);
  const tPixels = tData.data;

  for (let i = 0; i < W * H; i++) {
    if (mask[i]) {
      const pi = i * 4;
      tPixels[pi + 3] = 0; // Make white pixels transparent
    }
  }
  tempCtx.putImageData(tData, 0, 0);

  // Draw the case frame (with transparent cutout) on top of the design
  ctx.drawImage(tempCanvas, 0, 0);

  return cvs.toDataURL('image/png');
};

/**
 * Loads an image from URL and returns an HTMLImageElement.
 */
export const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};
