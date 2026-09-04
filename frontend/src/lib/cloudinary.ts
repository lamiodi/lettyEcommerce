/**
 * Cloudinary image CDN URL builder & optimization helper.
 * Cloud name: jtsxpm1l
 *
 * Automatically injects f_auto (AVIF/WebP) and q_auto (optimal perceptual compression)
 * so products load lightning-fast across mobile and desktop.
 */

export const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "jtsxpm1l";

export interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  crop?: "limit" | "fill" | "fit" | "thumb" | "scale";
  quality?: "auto" | "auto:best" | "auto:good" | "auto:eco" | "auto:low" | number;
  format?: "auto" | "webp" | "avif" | "png" | "jpg";
}

export function getCloudinaryUrl(
  pathOrUrl: string,
  options: CloudinaryTransformOptions = {},
): string {
  if (!pathOrUrl) return "";

  const {
    width,
    height,
    crop = "limit",
    quality = "auto",
    format = "auto",
  } = options;

  const transforms: string[] = [`f_${format}`, `q_${quality}`];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (width || height) transforms.push(`c_${crop}`);

  const transformString = transforms.join(",");

  // Already a Cloudinary URL
  if (pathOrUrl.includes("res.cloudinary.com")) {
    if (pathOrUrl.includes("/image/upload/")) {
      return pathOrUrl.replace(
        /\/image\/upload\/(?:[^/]+\/)?/,
        `/image/upload/${transformString}/`,
      );
    }
    return pathOrUrl;
  }

  // External web URL
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  // Local path — map to Cloudinary CDN folder 'letty'
  const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformString}/v1/letty${cleanPath}`;
}
