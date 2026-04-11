"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  runDashboardSync,
  type DashboardSyncActionState,
} from "@/app/dashboard/actions";

const initialState: DashboardSyncActionState = {
  ok: true,
  title: "Ручная синхронизация из RetailCRM.",
  details: "Запуск идёт на сервере без раскрытия секретов в браузере.",
};

const pendingSteps = [
  {
    title: "Получаем заказы из RetailCRM.",
    details: "Читаю страницы CRM API и собираю актуальные заказы.",
  },
  {
    title: "Нормализуем и обогащаем данные.",
    details: "Привожу поля заказов к аналитическому формату и пересчитываю суммы.",
  },
  {
    title: "Загружаем данные в Supabase.",
    details: "Выполняю upsert в таблицу orders и обновляю уже существующие записи.",
  },
  {
    title: "Проверяем Telegram-уведомления.",
    details: "Отправляю сообщения только для новых крупных заказов без дублей.",
  },
];

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="primary-action-button" disabled={pending}>
      {pending ? "Синхронизация..." : "Синхронизировать"}
    </button>
  );
}

function SyncStatus({
  state,
  stepIndex,
  onStepChange,
}: {
  state: DashboardSyncActionState;
  stepIndex: number;
  onStepChange: (updater: (currentIndex: number) => number) => void;
}) {
  const { pending } = useFormStatus();

  useEffect(() => {
    if (!pending) {
      return;
    }

    const intervalId = window.setInterval(() => {
      onStepChange((currentIndex) => (currentIndex + 1) % pendingSteps.length);
    }, 1800);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [onStepChange, pending]);

  if (pending) {
    const step = pendingSteps[stepIndex];

    return (
      <>
        <p className="inline-status inline-status--idle">{step.title}</p>
        <p className="inline-status-details">{step.details}</p>
      </>
    );
  }

  const tone = state.ok ? "success" : "error";

  return (
    <>
      <p className={`inline-status inline-status--${tone}`}>{state.title}</p>
      {state.details ? <p className="inline-status-details">{state.details}</p> : null}
    </>
  );
}

export function SyncButton() {
  const [state, formAction] = useActionState(runDashboardSync, initialState);
  const [stepIndex, setStepIndex] = useState(0);

  return (
    <form
      action={formAction}
      className="dashboard-actions"
      onSubmit={() => {
        setStepIndex(0);
      }}
    >
      <SubmitButton />
      <SyncStatus state={state} stepIndex={stepIndex} onStepChange={setStepIndex} />
    </form>
  );
}
