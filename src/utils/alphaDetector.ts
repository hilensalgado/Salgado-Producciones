import { PhotoSlot } from '../types';

interface DetectedBox {
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
}

/**
 * Analyzes an image with transparency (PNG) and identifies the largest rectangular transparent cutout windows.
 */
export async function detectTransparentCutouts(imageSrc: string): Promise<PhotoSlot[] | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        // Downscale for fast pixel processing
        const maxDim = 600;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);

        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Binary transparency mask: true if alpha < 40
        const isTransparent = new Uint8Array(w * h);
        let transparentPixelCount = 0;

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          const pixelIndex = i / 4;
          if (alpha < 40) {
            isTransparent[pixelIndex] = 1;
            transparentPixelCount++;
          }
        }

        // If there is minimal or no transparency, return null
        if (transparentPixelCount < w * h * 0.02) {
          return resolve(null);
        }

        // Find connected components or grid scan for transparent blocks
        const visited = new Uint8Array(w * h);
        const boxes: DetectedBox[] = [];

        const step = 2; // sample step
        for (let y = 0; y < h; y += step) {
          for (let x = 0; x < w; x += step) {
            const idx = y * w + x;
            if (isTransparent[idx] === 1 && visited[idx] === 0) {
              // Expand bounding box for this transparent region using Flood Fill (BFS)
              let minX = x;
              let maxX = x;
              let minY = y;
              let maxY = y;
              let count = 0;

              const queue: number[] = [idx];
              visited[idx] = 1;

              while (queue.length > 0) {
                const current = queue.pop()!;
                const cy = Math.floor(current / w);
                const cx = current % w;

                minX = Math.min(minX, cx);
                maxX = Math.max(maxX, cx);
                minY = Math.min(minY, cy);
                maxY = Math.max(maxY, cy);
                count++;

                // Check 4 neighbors
                const neighbors = [
                  cy > 0 ? (cy - 1) * w + cx : -1,
                  cy < h - 1 ? (cy + 1) * w + cx : -1,
                  cx > 0 ? cy * w + (cx - 1) : -1,
                  cx < w - 1 ? cy * w + (cx + 1) : -1,
                ];

                for (const n of neighbors) {
                  if (n >= 0 && visited[n] === 0 && isTransparent[n] === 1) {
                    visited[n] = 1;
                    queue.push(n);
                  }
                }
              }

              const boxW = maxX - minX + 1;
              const boxH = maxY - minY + 1;
              const area = boxW * boxH;

              // Filter out tiny noise holes
              if (area > (w * h) * 0.015 && boxW > w * 0.08 && boxH > h * 0.08) {
                boxes.push({
                  x: minX,
                  y: minY,
                  width: boxW,
                  height: boxH,
                  area,
                });
              }
            }
          }
        }

        if (boxes.length === 0) {
          return resolve(null);
        }

        // Sort by area descending
        boxes.sort((a, b) => b.area - a.area);

        // Take top 3 largest boxes (or as many as found up to 3)
        const topBoxes = boxes.slice(0, 3);

        // Classify boxes based on positions and aspect ratios
        // Convert to percentage values (0 - 100)
        const photoSlots: PhotoSlot[] = [];

        // Identify group photo (usually higher up or widest)
        // Sort remaining by Y position
        topBoxes.sort((a, b) => a.y - b.y);

        let groupCandidate = topBoxes[0];
        // If there's another box that is significantly wider, prefer it for group
        const widest = [...topBoxes].sort((a, b) => (b.width / b.height) - (a.width / a.height))[0];
        if (widest && (widest.width / widest.height) > 1.3) {
          groupCandidate = widest;
        }

        const otherBoxes = topBoxes.filter(b => b !== groupCandidate);
        // Sort remaining 2 boxes from left to right (X position)
        otherBoxes.sort((a, b) => a.x - b.x);

        const teacherCandidate = otherBoxes[0];
        const individualCandidate = otherBoxes[1] || otherBoxes[0];

        // Slot 1: Group
        if (groupCandidate) {
          photoSlots.push({
            id: 'slot-group',
            type: 'group',
            label: 'Foto Grupal',
            x: Math.round((groupCandidate.x / w) * 1000) / 10,
            y: Math.round((groupCandidate.y / h) * 1000) / 10,
            width: Math.round((groupCandidate.width / w) * 1000) / 10,
            height: Math.round((groupCandidate.height / h) * 1000) / 10,
          });
        }

        // Slot 2: Teacher
        if (teacherCandidate) {
          photoSlots.push({
            id: 'slot-teacher',
            type: 'teacher',
            label: 'Foto con Maestra',
            x: Math.round((teacherCandidate.x / w) * 1000) / 10,
            y: Math.round((teacherCandidate.y / h) * 1000) / 10,
            width: Math.round((teacherCandidate.width / w) * 1000) / 10,
            height: Math.round((teacherCandidate.height / h) * 1000) / 10,
          });
        }

        // Slot 3: Individual
        if (individualCandidate && individualCandidate !== teacherCandidate) {
          photoSlots.push({
            id: 'slot-individual',
            type: 'individual',
            label: 'Foto Individual',
            x: Math.round((individualCandidate.x / w) * 1000) / 10,
            y: Math.round((individualCandidate.y / h) * 1000) / 10,
            width: Math.round((individualCandidate.width / w) * 1000) / 10,
            height: Math.round((individualCandidate.height / h) * 1000) / 10,
          });
        }

        resolve(photoSlots.length > 0 ? photoSlots : null);
      } catch (err) {
        console.error('Error detecting transparent cutouts:', err);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageSrc;
  });
}
