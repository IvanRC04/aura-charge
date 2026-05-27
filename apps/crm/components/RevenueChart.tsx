"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Row = { day: string; revenue: string | null; kwh: string | null; count: number };

export function RevenueChart({ data }: { data: Row[] }) {
  const cleaned = data.map((r) => ({
    day: r.day.slice(5), // MM-DD
    revenue: Number(r.revenue ?? 0),
    kwh: Number(r.kwh ?? 0),
    count: r.count,
  }));
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer>
        <BarChart data={cleaned} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(90,94,65,0.12)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(90,94,65,0.55)", fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(90,94,65,0.55)", fontSize: 11 }}
            width={36}
            tickFormatter={(v: number) => `${v}€`}
          />
          <Tooltip
            cursor={{ fill: "rgba(90,94,65,0.06)" }}
            contentStyle={{
              background: "#f7f2e7",
              border: "1px solid rgba(90,94,65,0.2)",
              borderRadius: 10,
              color: "#5a5e41",
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => {
              if (name === "revenue") return [`${value.toFixed(2)} €`, "Ingresos"];
              return [value, name];
            }}
          />
          <Bar
            dataKey="revenue"
            fill="#8b9d4f"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
