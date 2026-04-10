import { NextResponse } from "next/server";

import { syncRetailCrmToSupabase } from "@/app/api/_lib/sync";
import { assertApiToken } from "@/lib/api-auth";
import { AppError, getReadableError } from "@/lib/errors";
import { syncRequestBodySchema, validateOrThrow } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertApiToken(request.headers.get("x-api-token"));

    const rawBody = (await request.json().catch(() => null)) as unknown;
    validateOrThrow(
      syncRequestBodySchema,
      rawBody ?? {},
      "Sync request body is invalid.",
    );

    const result = await syncRetailCrmToSupabase();

    return NextResponse.json(
      {
        ok: true,
        ...result,
      },
      { status: 200 },
    );
  } catch (error) {
    const readable = getReadableError(error, "Sync failed.");

    return NextResponse.json(
      {
        ok: false,
        error: readable.message,
        details: readable.details,
      },
      { status: readable.statusCode },
    );
  }
}

export async function GET() {
  try {
    throw new AppError(
      "Method not allowed.",
      405,
      "Use POST to trigger RetailCRM -> Supabase sync.",
    );
  } catch (error) {
    const readable = getReadableError(error, "Sync failed.");

    return NextResponse.json(
      {
        ok: false,
        error: readable.message,
        details: readable.details,
      },
      { status: readable.statusCode },
    );
  }
}
