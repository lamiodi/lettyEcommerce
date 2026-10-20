import { getBackendUrl } from "@/lib/backend";

/** Keep local preview presence on the local backend; production uses its API. */
export async function POST(request: Request) {
  const backend = process.env.NODE_ENV === "development" ? "http://127.0.0.1:4000" : getBackendUrl();
  try {
    const response = await fetch(`${backend}/api/public/product-presence`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: await request.text(), cache: "no-store", signal: AbortSignal.timeout(8000),
    });
    return new Response(await response.text(), { status: response.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Viewing activity is unavailable" }, { status: 503 });
  }
}
