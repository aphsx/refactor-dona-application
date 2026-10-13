import imageCompression from "browser-image-compression";

const AVATAR_SIZE = 128;
const WEBP_QUALITY = 0.72;
/** Stay under Next `/api/avatar` limit (100 KB). */
const MAX_SIZE_MB = 0.095;

/** Cover-crop to 128×128 then compress to a tiny WebP avatar blob. */
export async function compressAvatar(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("กรุณาเลือกรูปภาพ");
  }
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("ไม่สามารถประมวลผลรูปได้");

    const scale = Math.max(AVATAR_SIZE / bitmap.width, AVATAR_SIZE / bitmap.height);
    const w = bitmap.width * scale;
    const h = bitmap.height * scale;
    ctx.drawImage(bitmap, (AVATAR_SIZE - w) / 2, (AVATAR_SIZE - h) / 2, w, h);

    const cropped = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
    );
    if (!cropped) throw new Error("บีบอัดรูปไม่สำเร็จ");

    if (cropped.size <= MAX_SIZE_MB * 1024 * 1024) return cropped;

    return imageCompression(new File([cropped], "profile.webp", { type: "image/webp" }), {
      maxSizeMB: MAX_SIZE_MB,
      maxWidthOrHeight: AVATAR_SIZE,
      fileType: "image/webp",
      initialQuality: WEBP_QUALITY,
      useWebWorker: true,
    });
  } finally {
    bitmap.close();
  }
}
