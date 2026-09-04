/**
 * Backend Cloudinary helper and asset management.
 */
export const CLOUDINARY_CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  "jtsxpm1l";

export function getCloudinaryCdnUrl(localPath: string, width?: number): string {
  if (!localPath) return "";
  if (localPath.startsWith("http://") || localPath.startsWith("https://")) {
    return localPath;
  }
  const clean = localPath.startsWith("/") ? localPath : `/${localPath}`;
  const transforms = ["f_auto", "q_auto"];
  if (width) transforms.push(`w_${width}`, "c_limit");

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transforms.join(",")}/v1/letty${clean}`;
}
