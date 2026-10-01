import { cld } from "./cloudinary-url";
import type { WishMediaItem } from "./wish-types";

export type WishMedia = WishMediaItem;

// Responsive image URL. Example: img(m, 600) -> .../upload/w_600,f_auto,q_auto/...
export const img = (m: Pick<WishMediaItem, "url">, width: number) =>
  cld(m.url, `w_${width},f_auto,q_auto`);

// Video poster frame at second 0 as a jpg.
export const poster = (url: string) =>
  cld(url, "so_0,w_800,f_jpg,q_auto").replace(/\.\w+$/, ".jpg");

// Compressed video delivery.
export const videoSrc = (url: string) => cld(url, "w_720,f_auto,q_auto");

// Aspect ratio clamped between 4/5 and 5/4 so extreme images do not break layouts
// (the real image uses object-fit cover).
export const ratio = (m: Pick<WishMediaItem, "w" | "h">) =>
  Math.min(1.25, Math.max(0.8, (m.w || 1080) / (m.h || 1350)));

export const imagesOf = (media: WishMediaItem[]) =>
  media.filter((m) => m.type === "image").sort((a, b) => a.order - b.order);

export const videosOf = (media: WishMediaItem[]) =>
  media.filter((m) => m.type === "video").sort((a, b) => a.order - b.order);
