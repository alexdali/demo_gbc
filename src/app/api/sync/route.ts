import { NextResponse } from "next/server";

import { syncRetailCrmToSupabase } from "@/app/api/_lib/sync";
import { getReadableError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
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
  return NextResponse.json(
    {
      ok: true,
      message: "Use POST to trigger RetailCRM -> Supabase sync",
    },
    { status: 200 },
  );
}
