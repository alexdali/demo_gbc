import { NextResponse } from "next/server";

import { syncRetailCrmToSupabase } from "@/app/api/_lib/sync";

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
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Sync failed",
      },
      { status: 500 },
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
