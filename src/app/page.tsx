import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing-shell">
      <section className="hero-card">
        <span className="eyebrow">RetailCRM → Supabase → Vercel</span>
        <h1>GBC Analytics Dashboard</h1>
        <p>
          Минимальный end-to-end проект для загрузки заказов из RetailCRM, синхронизации
          в Supabase и визуализации аналитики на одной странице.
        </p>

        <div className="hero-actions">
          <Link href="/dashboard" className="primary-link">
            Открыть дашборд
          </Link>
        </div>
      </section>
    </main>
  );
}
