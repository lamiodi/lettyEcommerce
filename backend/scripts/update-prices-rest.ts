import "dotenv/config";
import { SignJWT } from "jose";

async function main() {
  const secretKey = process.env.JWT_SECRET_KEY!;
  const secret = new TextEncoder().encode(secretKey);
  const token = await new SignJWT({
    role: "service_role",
    iss: "supabase",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .sign(secret);

  // 1. Get existing products
  const listRes = await fetch("https://hjqylutputroxwmicdaq.supabase.co/rest/v1/products?select=id,slug,name,base_price_usd,base_price_gbp", {
    headers: {
      apikey: token,
      Authorization: `Bearer ${token}`,
    },
  });
  const products = await listRes.json();
  console.log("Current products in DB:", JSON.stringify(products, null, 2));

  // 2. Update Lip Gloss to £11 ($11 USD / £11 GBP)
  const glossRes = await fetch("https://hjqylutputroxwmicdaq.supabase.co/rest/v1/products?slug=eq.letty-glass-lip-gloss", {
    method: "PATCH",
    headers: {
      apikey: token,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      base_price_usd: 11,
      base_price_gbp: 11,
    }),
  });
  console.log("Updated Lip Gloss:", glossRes.status, await glossRes.text());

  // 3. Update Lip Liner to £9 ($9 USD / £9 GBP)
  const linerRes = await fetch("https://hjqylutputroxwmicdaq.supabase.co/rest/v1/products?slug=eq.letty-velvet-lip-liner", {
    method: "PATCH",
    headers: {
      apikey: token,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      base_price_usd: 9,
      base_price_gbp: 9,
    }),
  });
  console.log("Updated Lip Liner:", linerRes.status, await linerRes.text());
}

main().catch(console.error);
