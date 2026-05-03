/**
 * Returns false if the image URL is broken OR the image is essentially black/blank.
 * Uses canvas pixel-sampling on web; falls back to true (keep) on native.
 */
export async function isImageUsable(uri: string): Promise<boolean> {
  if (typeof document === 'undefined') return true;

  return new Promise((resolve) => {
    const img = new window.Image();
    // Try without crossOrigin first — most images can't be sampled due to CORS,
    // but we still catch hard load failures.
    img.onload = () => {
      // Attempt pixel sampling via canvas (requires CORS, may be tainted)
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(true); return; }
        ctx.drawImage(img, 0, 0, 16, 16);
        const { data } = ctx.getImageData(0, 0, 16, 16);
        let brightness = 0;
        let pixels = 0;
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 10) continue; // skip transparent
          brightness += (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
          pixels++;
        }
        if (pixels === 0) { resolve(false); return; }
        resolve(brightness / pixels > 8); // below 8/255 → essentially black
      } catch {
        // Canvas tainted (CORS) — image loaded fine visually, keep it
        resolve(true);
      }
    };
    img.onerror = () => resolve(false);
    img.src = uri;
  });
}
