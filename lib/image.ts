/**
 * Downscales an image file in the browser and returns it as a JPEG data URL.
 *
 * Transparent pixels (PNG/WEBP logos) are painted white first: JPEG has no
 * alpha channel, so without this they would come out black. Rejects when the
 * browser can't decode the file (e.g. HEIC on desktop) instead of hanging.
 */
export function resizeImage(file: File, maxPx = 480, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        const ratio = Math.min(maxPx / width, maxPx / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      URL.revokeObjectURL(url);
      if (!ctx) {
        reject(new Error("Não foi possível processar a imagem."));
        return;
      }
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Formato de imagem não suportado. Use JPG, PNG ou WEBP."));
    };
    img.src = url;
  });
}
