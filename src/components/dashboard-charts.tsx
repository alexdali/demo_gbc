"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { BreakdownPoint, DailyOrdersPoint } from "@/types/order";

type Props = {
  dailyOrders: DailyOrdersPoint[];
  bySource: BreakdownPoint[];
  byCity: BreakdownPoint[];
};

export function DashboardCharts({ dailyOrders, bySource, byCity }: Props) {
  return (
    <div className="charts-grid">
      <section className="chart-card">
        <div className="chart-header">
          <h2>Динамика заказов</h2>
          <p>Количество и выручка по дням</p>
        </div>
        <div className="chart-body">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={dailyOrders}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d6d2c4" />
              <XAxis dataKey="date" stroke="#54473f" />
              <YAxis stroke="#54473f" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="orders" stroke="#b8572f" strokeWidth={3} />
              <Line type="monotone" dataKey="revenue" stroke="#24443a" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="chart-card">
        <div className="chart-header">
          <h2>Источники заказов</h2>
          <p>Топ UTM source по количеству</p>
        </div>
        <div className="chart-body">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={bySource}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d6d2c4" />
              <XAxis dataKey="label" stroke="#54473f" />
              <YAxis stroke="#54473f" />
              <Tooltip />
              <Bar dataKey="count" fill="#c07a35" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="chart-card">
        <div className="chart-header">
          <h2>Города</h2>
          <p>Распределение заказов по географии</p>
        </div>
        <div className="chart-body">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={byCity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d6d2c4" />
              <XAxis dataKey="label" stroke="#54473f" />
              <YAxis stroke="#54473f" />
              <Tooltip />
              <Bar dataKey="count" fill="#456f61" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
