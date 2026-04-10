"use server";

import { revalidatePath } from "next/cache";

import { syncRetailCrmToSupabase, type SyncResult } from "@/app/api/_lib/sync";
import { getReadableError } from "@/lib/errors";

export type DashboardSyncActionState = {
  ok: boolean;
  title: string;
  details?: string;
  result?: SyncResult;
};

function formatSyncSummary(result: SyncResult) {
  return [
    `Заказы: ${result.ordersUpserted}`,
    `Страницы CRM: ${result.pagesFetched}`,
    `Telegram: ${result.notificationsSent} отправлено`,
  ].join(" · ");
}

export async function runDashboardSync(
  _previousState: DashboardSyncActionState,
): Promise<DashboardSyncActionState> {
  try {
    const result = await syncRetailCrmToSupabase();
    revalidatePath("/dashboard");

    return {
      ok: true,
      title: "Синхронизация завершена.",
      details: formatSyncSummary(result),
      result,
    };
  } catch (error) {
    const readable = getReadableError(error, "Sync failed.");

    return {
      ok: false,
      title: readable.message,
      details: readable.details ?? "Проверь env и серверные логи.",
    };
  }
}
