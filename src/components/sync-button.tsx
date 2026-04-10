"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

type SyncResponse = {
  ok: boolean;
  error?: string;
  details?: string;
  pagesFetched?: number;
  ordersFetched?: number;
  ordersUpserted?: number;
  notificationsSent?: number;
  notificationsSkipped?: number;
  skippedInitialBackfillNotifications?: boolean;
};

function formatSyncSummary(result: SyncResponse) {
  return [
    `Заказы: ${result.ordersUpserted ?? 0}`,
    `Страницы CRM: ${result.pagesFetched ?? 0}`,
    `Telegram: ${result.notificationsSent ?? 0} отправлено`,
  ].join(" · ");
}

export function SyncButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [status, setStatus] = useState<{
    tone: "idle" | "success" | "error";
    title: string;
    details?: string;
  }>({
    tone: "idle",
    title: "Ручная синхронизация доступна только после входа через basic auth.",
  });

  async function handleSync() {
    setIsPending(true);
    setStatus({
      tone: "idle",
      title: "Синхронизация выполняется.",
      details: "Забираю заказы из RetailCRM и обновляю Supabase.",
    });

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ confirm: "sync" }),
      });
      const payload = (await response.json().catch(() => null)) as SyncResponse | null;

      if (!response.ok || !payload?.ok) {
        setStatus({
          tone: "error",
          title: payload?.error ?? "Синхронизация завершилась ошибкой.",
          details: payload?.details ?? "Проверь логи API route и env-конфигурацию.",
        });
        return;
      }

      setStatus({
        tone: "success",
        title: "Синхронизация завершена.",
        details: formatSyncSummary(payload),
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось отправить запрос на синхронизацию.";

      setStatus({
        tone: "error",
        title: "Синхронизация завершилась ошибкой.",
        details: message,
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="dashboard-actions">
      <button
        type="button"
        className="primary-action-button"
        onClick={handleSync}
        disabled={isPending}
      >
        {isPending ? "Синхронизация..." : "Синхронизировать RetailCRM"}
      </button>

      <p className={`inline-status inline-status--${status.tone}`}>{status.title}</p>
      {status.details ? <p className="inline-status-details">{status.details}</p> : null}
    </div>
  );
}
