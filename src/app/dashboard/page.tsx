import { DashboardCharts } from "@/components/dashboard-charts";
import { SyncButton } from "@/components/sync-button";
import { getDashboardData } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(value));
}

export default async function DashboardPage() {
  const { error, kpis, dailyOrders, bySource, byCity } = await getDashboardData();

  return (
    <main className="dashboard-shell">
      <section className="dashboard-hero">
        <div>
          <span className="eyebrow">Analytics Dashboard</span>
          <h1>Заказы из RetailCRM</h1>
          <p>
            Данные загружаются из Supabase после синхронизации заказов из CRM.
            Дашборд построен как MVP с базовой защитой через basic auth, без
            полноценного пользовательского auth и сложного BI-слоя.
          </p>
        </div>
        <SyncButton />
      </section>

      {error ? (
        <section className="error-card">
          <strong>Данные пока недоступны</strong>
          <p>
            Не удалось загрузить таблицу `orders` из Supabase. Проверь схему, env и выполнен
            ли sync.
          </p>
          <code>{error}</code>
        </section>
      ) : null}

      <section className="kpi-grid">
        <article className="kpi-card">
          <span>Всего заказов</span>
          <strong>{kpis.totalOrders}</strong>
        </article>
        <article className="kpi-card">
          <span>Выручка</span>
          <strong>{formatCurrency(kpis.totalRevenue)} ₸</strong>
        </article>
        <article className="kpi-card">
          <span>Крупные заказы</span>
          <strong>{kpis.highValueOrders}</strong>
        </article>
        <article className="kpi-card">
          <span>Средний чек</span>
          <strong>{formatCurrency(kpis.averageOrderValue)} ₸</strong>
        </article>
      </section>

      <DashboardCharts dailyOrders={dailyOrders} bySource={bySource} byCity={byCity} />
    </main>
  );
}
