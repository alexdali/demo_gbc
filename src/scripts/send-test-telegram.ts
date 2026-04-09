import { sendTelegramMessage } from "@/lib/telegram";

async function main() {
  await sendTelegramMessage("Тестовое уведомление: Telegram интеграция настроена.");
  console.log("Test Telegram message sent");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
