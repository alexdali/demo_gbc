import { NextResponse } from "next/server";

import { sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { text?: string }
      | null;

    const text = body?.text?.trim() || "Тестовое уведомление: Telegram интеграция настроена.";
    const result = await sendTelegramMessage(text);

    return NextResponse.json(
      {
        ok: true,
        sent: true,
        result,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        sent: false,
        error: error instanceof Error ? error.message : "Telegram test failed",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      message: "Use POST to send a Telegram test message",
    },
    { status: 200 },
  );
}
