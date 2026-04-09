import { NextResponse } from "next/server";

import { getReadableError } from "@/lib/errors";
import { sendTelegramMessage } from "@/lib/telegram";
import { telegramTestBodySchema, validateOrThrow } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rawBody = (await request.json().catch(() => null)) as unknown;
    const body = validateOrThrow(
      telegramTestBodySchema,
      rawBody ?? {},
      "Telegram test request body is invalid.",
    );

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
    const readable = getReadableError(error, "Telegram test failed.");

    return NextResponse.json(
      {
        ok: false,
        sent: false,
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
      message: "Use POST to send a Telegram test message",
    },
    { status: 200 },
  );
}
