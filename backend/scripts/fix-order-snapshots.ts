import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const client = createClient(url, key);

const MWAH_NOIR_IMAGE = "https://www.houseofletty.com/products/mwah/mwah-noir.webp";
const MWAH_IVORY_IMAGE = "https://www.houseofletty.com/products/mwah/mwah-ivory.webp";

async function main() {
  console.log("Fetching order items...");
  const { data: items, error } = await client
    .from("order_items")
    .select("id, order_id, variant_id, product_snapshot");

  if (error) {
    console.error("Error fetching order_items:", error);
    return;
  }

  let updatedCount = 0;
  for (const item of items ?? []) {
    const snap = (item.product_snapshot as any) || {};
    const sku = snap.sku;
    const options = snap.options || [];
    const isNoir = sku === "LET-MWAH-NR" || JSON.stringify(options).toLowerCase().includes("noir");
    const isIvory = sku === "LET-MWAH-IV" || JSON.stringify(options).toLowerCase().includes("ivory");

    let targetImage: string | null = null;
    if (isNoir && snap.primary_image !== MWAH_NOIR_IMAGE) {
      targetImage = MWAH_NOIR_IMAGE;
    } else if (isIvory && snap.primary_image !== MWAH_IVORY_IMAGE) {
      targetImage = MWAH_IVORY_IMAGE;
    }

    if (targetImage) {
      console.log(`Fixing item ${item.id} (SKU: ${sku}): changing image from ${snap.primary_image} to ${targetImage}`);
      const updatedSnapshot = {
        ...snap,
        primary_image: targetImage,
      };

      const { error: updateErr } = await client
        .from("order_items")
        .update({ product_snapshot: updatedSnapshot })
        .eq("id", item.id);

      if (updateErr) {
        console.error(`Failed to update item ${item.id}:`, updateErr);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`Successfully updated ${updatedCount} order item snapshots.`);

  // Also inspect and fix any queued confirmations in email_outbox if present
  const { data: outboxRows, error: outboxErr } = await client
    .from("email_outbox")
    .select("id, dedupe_key, payload");

  if (!outboxErr && outboxRows) {
    for (const row of outboxRows) {
      const payloadStr = JSON.stringify(row.payload);
      if (payloadStr.includes("mwah-ivory.webp") && payloadStr.includes("Noir Edition")) {
        console.log(`Fixing email_outbox row ${row.id}...`);
        const fixedPayload = JSON.parse(payloadStr.replace(/mwah-ivory\.webp/g, "mwah-noir.webp"));
        await client
          .from("email_outbox")
          .update({ payload: fixedPayload })
          .eq("id", row.id);
        console.log(`Updated email_outbox row ${row.id}`);
      }
    }
  }
}

main().catch(console.error);
