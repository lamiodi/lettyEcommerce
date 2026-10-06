import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error(
    "Missing Cloudinary credentials — set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET (see .env.example).",
  );
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

async function main() {
  console.log(`☁️ Connecting to Cloudinary (cloud: ${cloudName})...`);
  const ping = await cloudinary.api.ping();
  console.log("✓ Cloudinary connected successfully:", ping);

  const publicDir = join(process.cwd(), "..", "frontend", "public");

  function findImages(dir: string): string[] {
    const list: string[] = [];
    for (const item of readdirSync(dir)) {
      const full = join(dir, item);
      if (statSync(full).isDirectory()) {
        list.push(...findImages(full));
      } else if (/\.(png|jpg|jpeg|webp|svg)$/i.test(item)) {
        list.push(full);
      }
    }
    return list;
  }

  // 1. Gather all product images
  const productImages = findImages(join(publicDir, "products"));

  // 2. Gather top-level editorial images used in products
  const editorialImages = [
    join(publicDir, "IMG_6386.PNG"),
    join(publicDir, "IMG_6270.PNG"),
    join(publicDir, "IMG_6549.webp"),
  ].filter((f) => {
    try {
      return statSync(f).isFile();
    } catch {
      return false;
    }
  });

  const allImages = [...productImages, ...editorialImages];
  console.log(`Found ${allImages.length} images to upload to Cloudinary.`);

  let successCount = 0;
  for (const imgPath of allImages) {
    const rel = relative(publicDir, imgPath).replace(/\\/g, "/");
    const pathNoExt = rel.replace(/\.[^/.]+$/, "");
    const publicId = `letty/${pathNoExt}`;

    process.stdout.write(`Uploading ${rel} ... `);
    try {
      const result = await cloudinary.uploader.upload(imgPath, {
        public_id: publicId,
        overwrite: true,
        resource_type: "image",
      });
      successCount++;
      console.log(`OK (${result.format}, ${Math.round(result.bytes / 1024)} KB)`);
    } catch (err: any) {
      console.error(`FAILED: ${err.message}`);
    }
  }

  console.log(`\n🎉 Finished! Successfully uploaded ${successCount}/${allImages.length} images to Cloudinary.`);
}

main().catch((err) => {
  console.error("Upload error:", err);
  process.exit(1);
});
