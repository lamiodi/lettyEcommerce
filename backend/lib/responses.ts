/**
 * Stable JSON response helpers. Every API route should respond via these
 * to keep the response envelope consistent.
 */
import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ data }, { status: 200, ...init });
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json({ data }, { status: 201 });
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function paginated<T>(items: T[], total: number, page: number, perPage: number) {
  return NextResponse.json({
    data: items,
    meta: {
      total,
      page,
      per_page: perPage,
      total_pages: Math.max(1, Math.ceil(total / perPage)),
    },
  });
}
