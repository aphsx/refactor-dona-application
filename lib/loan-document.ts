/** Client-side shrink for loan uploads — images and PDFs. Prefer smaller output. */

const MAX_EDGE = 1400;
const JPEG_QUALITY = 0.8;
const JPEG_QUALITY_FALLBACK = 0.68;
const TARGET_MAX_BYTES = 1_200_000;

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

function baseName(file: File) {
  return file.name.replace(/\.[^.]+$/, "") || "loan-document";
}

function pickSmaller(original: File, candidate: File): File {
  return candidate.size > 0 && candidate.size < original.size ? candidate : original;
}

async function compressImage(file: File): Promise<File> {
  const image = await loadImage(file);
  const longest = Math.max(image.naturalWidth, image.naturalHeight);
  const scale = longest > MAX_EDGE ? MAX_EDGE / longest : 1;
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(image, 0, 0, width, height);

  let blob = await canvasToJpeg(canvas, JPEG_QUALITY);
  if (blob.size > TARGET_MAX_BYTES) {
    blob = await canvasToJpeg(canvas, JPEG_QUALITY_FALLBACK);
  }

  const out = new File([blob], `${baseName(file)}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
  return pickSmaller(file, out);
}

async function compressPdf(file: File): Promise<File> {
  const pdfjs = await import("pdfjs-dist");
  const { PDFDocument } = await import("pdf-lib");

  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }

  const data = new Uint8Array(await file.arrayBuffer());
  const source = await pdfjs.getDocument({
    data,
    useSystemFonts: true,
  }).promise;

  const outDoc = await PDFDocument.create();
  const pageCount = source.numPages;

  for (let i = 1; i <= pageCount; i += 1) {
    const page = await source.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const longest = Math.max(base.width, base.height);
    const scale = Math.min(2, MAX_EDGE / longest);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderTask = page.render({ canvasContext: ctx, viewport, canvas });
    await renderTask.promise;

    let jpeg = await canvasToJpeg(canvas, JPEG_QUALITY);
    if (jpeg.size > TARGET_MAX_BYTES / Math.max(1, Math.min(pageCount, 3))) {
      jpeg = await canvasToJpeg(canvas, JPEG_QUALITY_FALLBACK);
    }

    const embedded = await outDoc.embedJpg(new Uint8Array(await jpeg.arrayBuffer()));
    const pdfPage = outDoc.addPage([embedded.width, embedded.height]);
    pdfPage.drawImage(embedded, {
      x: 0,
      y: 0,
      width: embedded.width,
      height: embedded.height,
    });
  }

  if (outDoc.getPageCount() === 0) return file;

  const bytes = await outDoc.save({ useObjectStreams: true });
  const out = new File([Uint8Array.from(bytes)], `${baseName(file)}.pdf`, {
    type: "application/pdf",
    lastModified: Date.now(),
  });
  return pickSmaller(file, out);
}

/** Shrink any loan document (image or PDF). Never returns a larger file. */
export async function compressLoanDocument(file: File): Promise<File> {
  try {
    if (file.type.startsWith("image/")) return await compressImage(file);
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      return await compressPdf(file);
    }
  } catch {
    // Fall through — upload original if compress fails.
  }
  return file;
}

/** @deprecated use compressLoanDocument */
export async function compressLoanDocumentImage(file: File): Promise<File> {
  return compressLoanDocument(file);
}
