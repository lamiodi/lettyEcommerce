import { NextRequest } from "next/server";
import { z } from "zod";
import { ProductPresence } from "@/lib/product-presence";
import { enforceRateLimit } from "@/lib/cache/redis";
import { clientIp } from "@/lib/utils/client-ip";

const presence = new ProductPresence();
const payload = z.object({
  slug: z.enum(["letty-velvet-lip-liner", "letty-glass-lip-gloss", "letty-lash-book-kit", "letty-mwah-lip-balm"]),
  sessionId: z.string().uuid(),
  active: z.boolean(),
});

export async function POST(request: NextRequest) {
  const rateLimit = await enforceRateLimit("public", `presence:${clientIp(request)}`);
  if (!rateLimit.success) return Response.json({ error: "Too many requests" }, { status: 429 });
  const parsed = payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid viewing session" }, { status: 400 });
  const { slug, sessionId, active } = parsed.data;
  return Response.json({ count: presence.heartbeat(slug, sessionId, active) }, { headers: { "Cache-Control": "no-store" } });
}
