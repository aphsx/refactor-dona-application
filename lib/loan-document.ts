/** Mild client-side compress for loan document images (not avatar-tiny). */
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.85;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("อ่านรูปไม่สำเร็จ"));
    };
    image.src = url;
  });
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("บีบอัดรูปไม่สำเร็จ"));
      },
      "image/jpeg",
      quality,
    );
  });
}

/** Resize longest edge to MAX_EDGE and encode JPEG — smaller file, still clear for docs. */
export async function compressLoanDocumentImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const image = await loadImage(file);
  const longest = Math.max(image.naturalWidth, image.naturalHeight);
  const scale = longest > MAX_EDGE ? MAX_EDGE / longest : 1;
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  if (scale === 1 && file.type === "image/jpeg" && file.size <= 1_500_000) {
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(image, 0, 0, width, height);

  let blob = await canvasToJpeg(canvas, JPEG_QUALITY);
  if (blob.size > 2_000_000) {
    blob = await canvasToJpeg(canvas, 0.78);
  }

  const base = file.name.replace(/\.[^.]+$/, "") || "loan-document";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}
