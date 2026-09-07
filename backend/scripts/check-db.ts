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

  console.log("Generated token prefix:", token.slice(0, 25));

  const res = await fetch("https://hjqylutputroxwmicdaq.supabase.co/rest/v1/orders?select=count", {
    headers: {
      apikey: token,
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("Supabase REST status:", res.status);
  const text = await res.text();
  console.log("Supabase REST response:", text);
}

main().catch(console.error);
