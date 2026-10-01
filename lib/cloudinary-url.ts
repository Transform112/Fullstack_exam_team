// Inserts a Cloudinary transformation into a delivery URL.
// Example: cld(url, "w_1200,f_auto,q_auto"). Non-Cloudinary URLs are returned unchanged.
export function cld(url: string, transform = "f_auto,q_auto"): string {
  if (!url) return url;
  return url.includes("/upload/") ? url.replace("/upload/", `/upload/${transform}/`) : url;
}
