// Redimensiona e comprime uma imagem antes de guardá-la como base64. Fotos de
// celular costumam vir enormes (vários MB), o que estoura rápido a cota de
// armazenamento do navegador. PNG/WebP mantêm o formato (preserva transparência
// de recortes de produto); os demais viram JPEG, bem mais leve.
export function compressImageFile(file: File, maxDim = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Falha ao carregar imagem"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas 2D não suportado"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const keepAlpha = file.type === "image/png" || file.type === "image/webp";
        resolve(keepAlpha ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
