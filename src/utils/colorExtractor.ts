/**
 * Extrai automaticamente as 2 cores predominantes/marcantes de uma imagem de logotipo
 */
export async function extractColorsFromImage(
  dataUrl: string
): Promise<{ primaryColor: string; secondaryColor: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ primaryColor: '#0284c7', secondaryColor: '#0ea5e9' });
          return;
        }

        // Downsample for performance
        const width = (canvas.width = 100);
        const height = (canvas.height = 100);
        ctx.drawImage(img, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height).data;
        const colorBuckets: Record<string, { count: number; r: number; g: number; b: number }> = {};

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Ignore transparent pixels
          if (a < 128) continue;

          // Ignore pure white, near white, pure black, near black
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          if (brightness > 240 || brightness < 20) continue;

          // Ignore pure washed out grays
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max - min < 15 && (brightness > 180 || brightness < 50)) continue;

          // Quantize color into buckets (step of 24)
          const qr = Math.round(r / 24) * 24;
          const qg = Math.round(g / 24) * 24;
          const qb = Math.round(b / 24) * 24;
          const key = `${qr},${qg},${qb}`;

          if (!colorBuckets[key]) {
            colorBuckets[key] = { count: 1, r, g, b };
          } else {
            colorBuckets[key].count++;
          }
        }

        const sorted = Object.values(colorBuckets).sort((a, b) => b.count - a.count);

        const toHex = (r: number, g: number, b: number) => {
          return (
            '#' +
            [r, g, b]
              .map((x) => {
                const hex = Math.min(255, Math.max(0, x)).toString(16);
                return hex.length === 1 ? '0' + hex : hex;
              })
              .join('')
          );
        };

        if (sorted.length === 0) {
          resolve({ primaryColor: '#0284c7', secondaryColor: '#0ea5e9' });
          return;
        }

        const first = sorted[0];
        const primaryHex = toHex(first.r, first.g, first.b);

        // Find a second distinct color
        let secondaryHex = '#0ea5e9';
        for (let i = 1; i < sorted.length; i++) {
          const cand = sorted[i];
          const diff =
            Math.abs(cand.r - first.r) +
            Math.abs(cand.g - first.g) +
            Math.abs(cand.b - first.b);
          if (diff > 80) {
            secondaryHex = toHex(cand.r, cand.g, cand.b);
            break;
          }
        }

        resolve({ primaryColor: primaryHex, secondaryColor: secondaryHex });
      } catch (e) {
        console.warn('Erro ao extrair cores do logo:', e);
        resolve({ primaryColor: '#0284c7', secondaryColor: '#0ea5e9' });
      }
    };
    img.onerror = () => {
      resolve({ primaryColor: '#0284c7', secondaryColor: '#0ea5e9' });
    };
    img.src = dataUrl;
  });
}

export async function extractDominantColors(
  dataUrl: string
): Promise<{ primary: string; secondary: string }> {
  const res = await extractColorsFromImage(dataUrl);
  return { primary: res.primaryColor, secondary: res.secondaryColor };
}
