import { env } from "@/lib/env";
import { corsHeaders } from "@/lib/cors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return Response.json(
    {
      status: "ok",
      service: "letty-backend",
      version: "1.0.0",
      env: env().NODE_ENV,
      time: new Date().toISOString(),
    },
    { headers: corsHeaders() },
  );
}
