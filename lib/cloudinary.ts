import { v2 as cloudinary } from "cloudinary";

// Server-only Cloudinary client. The API secret never reaches the browser.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export const IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp", "heic", "heif"];
export const VIDEO_FORMATS = ["mp4"];
export const IMAGE_MAX_BYTES = 8 * 1024 * 1024; // 8 MB
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024; // 50 MB
export const VIDEO_MAX_SECONDS = 60;
export const MAX_IMAGES = 15;
export const MAX_VIDEOS = 2;

// Signed parameters for a direct browser upload. allowed_formats is signed, so the
// browser must send the exact same value back to Cloudinary.
export function signUpload(userId: string, resourceType: "image" | "video") {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `wishly/${userId}`;
  const allowedFormats = resourceType === "image" ? "jpg,jpeg,png,webp,heic,heif" : "mp4";
  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp, allowed_formats: allowedFormats },
    process.env.CLOUDINARY_API_SECRET as string,
  );
  return { folder, timestamp, allowedFormats, signature, resourceType };
}
