// Client-side media pipeline (docs/02 SECTION 10). Files are validated and compressed
// in the browser, uploaded straight to Cloudinary with a signed request, then the
// server verifies the asset before it is added to the page.
import { api } from "./client-api";
import type { MediaItem } from "./wizard";

export const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
export const VIDEO_MIME = ["video/mp4"];
export const IMAGE_MAX_BYTES = 8 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;
export const VIDEO_MAX_SECONDS = 60;
export const MAX_IMAGES = 15;
export const MAX_VIDEOS = 2;

export function isHeic(file: File) {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type.includes("heic") ||
    type.includes("heif") ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

export function resourceTypeOf(file: File): "image" | "video" | null {
  if (
    IMAGE_MIME.includes(file.type.toLowerCase()) ||
    /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)
  ) {
    return "image";
  }
  if (VIDEO_MIME.includes(file.type.toLowerCase()) || /\.mp4$/i.test(file.name)) return "video";
  return null;
}

// Reads the duration of a video file in the browser before it is uploaded.
export function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(video.duration) ? video.duration : 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    video.src = url;
  });
}

export type ValidationResult = { ok: true } | { ok: false; message: string };

// Step 2 of the media pipeline: type, size and count limits, plus video duration.
export async function validateFile(file: File, existing: MediaItem[]): Promise<ValidationResult> {
  const kind = resourceTypeOf(file);
  if (!kind) return { ok: false, message: `${file.name} is not a supported file type` };

  const images = existing.filter((m) => m.type === "image").length;
  const videos = existing.filter((m) => m.type === "video").length;

  if (kind === "image") {
    if (images >= MAX_IMAGES)
      return { ok: false, message: `You can add up to ${MAX_IMAGES} photos` };
    if (file.size > IMAGE_MAX_BYTES)
      return { ok: false, message: `${file.name} is larger than 8 MB` };
  } else {
    if (videos >= MAX_VIDEOS)
      return { ok: false, message: `You can add up to ${MAX_VIDEOS} videos` };
    if (file.size > VIDEO_MAX_BYTES)
      return { ok: false, message: `${file.name} is larger than 50 MB` };
    const duration = await readVideoDuration(file);
    if (duration > VIDEO_MAX_SECONDS) {
      return { ok: false, message: `${file.name} is longer than 60 seconds` };
    }
  }
  return { ok: true };
}

// HEIC/HEIF files are uploaded as they are: the browser cannot re-encode them.
export async function compressImage(file: File): Promise<File> {
  if (isHeic(file)) return file;
  const { default: imageCompression } = await import("browser-image-compression");
  try {
    return await imageCompression(file, {
      maxWidthOrHeight: 2000,
      maxSizeMB: 1.5,
      useWebWorker: true,
    });
  } catch {
    return file;
  }
}

type SignResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  allowedFormats: string;
  signature: string;
  uploadUrl: string;
};

type CloudinaryUploadResponse = { public_id: string };

// Steps 4 to 6: sign, upload with progress through XMLHttpRequest, then register the
// asset so the server can verify it.
export async function uploadToCloudinary(
  file: File,
  pageId: string,
  resourceType: "image" | "video",
  onProgress?: (percent: number) => void,
): Promise<MediaItem> {
  const sign = await api<SignResponse>("/uploads/sign", {
    method: "POST",
    body: { resourceType },
  });

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sign.apiKey);
  form.append("timestamp", String(sign.timestamp));
  form.append("folder", sign.folder);
  form.append("allowed_formats", sign.allowedFormats);
  form.append("signature", sign.signature);

  const uploaded = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", sign.uploadUrl);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as CloudinaryUploadResponse);
        } catch {
          reject(new Error("Upload response could not be read"));
        }
      } else {
        reject(new Error("Upload failed. Please check your connection and try again."));
      }
    };
    xhr.onerror = () =>
      reject(new Error("Upload failed. Please check your connection and try again."));
    xhr.send(form);
  });

  const result = await api<{ media: MediaItem; rev: number }>("/media", {
    method: "POST",
    body: { pageId, publicId: uploaded.public_id, resourceType },
  });
  onProgress?.(100);
  return result.media;
}
