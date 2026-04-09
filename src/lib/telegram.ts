import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";

export async function sendTelegramMessage(text: string) {
  const normalizedText = text.trim();

  if (!normalizedText) {
    throw new AppError("Telegram message text cannot be empty.", 400);
  }

  if (normalizedText.length > 4000) {
    throw new AppError("Telegram message text is too long.", 400);
  }

  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: normalizedText,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new AppError(
      `Telegram sendMessage failed with ${response.status}.`,
      502,
      body,
    );
  }

  const result = (await response.json()) as { ok?: boolean; description?: string };

  if (!result.ok) {
    throw new AppError(
      "Telegram API returned an unsuccessful response.",
      502,
      result.description,
    );
  }

  return result;
}
