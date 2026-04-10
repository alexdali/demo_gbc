"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  runDashboardSync,
  type DashboardSyncActionState,
} from "@/app/dashboard/actions";

const initialState: DashboardSyncActionState = {
  ok: true,
  title: "Нажми кнопку, чтобы вручную обновить данные из RetailCRM.",
  details: "Кнопка запускает серверную синхронизацию без показа секретов в браузере.",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="primary-action-button" disabled={pending}>
      {pending ? "Синхронизация..." : "Синхронизировать RetailCRM"}
    </button>
  );
}

export function SyncButton() {
  const [state, formAction] = useActionState(runDashboardSync, initialState);
  const tone = state.ok ? "success" : "error";

  return (
    <form action={formAction} className="dashboard-actions">
      <SubmitButton />
      <p className={`inline-status inline-status--${tone}`}>{state.title}</p>
      {state.details ? <p className="inline-status-details">{state.details}</p> : null}
    </form>
  );
}
