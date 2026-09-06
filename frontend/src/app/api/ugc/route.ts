import { NextResponse } from "next/server";
import { DEFAULT_UGC_VIDEOS } from "@/lib/data/ugc-videos";

export const revalidate = 60;

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: DEFAULT_UGC_VIDEOS,
    });
  } catch {
    return NextResponse.json({ success: true, data: DEFAULT_UGC_VIDEOS }, { status: 200 });
  }
}
