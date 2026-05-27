"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export function PowerCurveChart({
  history,
  maxKw,
}: {
  history: Array<{ t: number; powerKw: number }>;
  maxKw: number;
}) {
  const t0 = history[0]?.t ?? Date.now();
  const data = history.map((h) => ({
    s: Math.round((h.t - t0) / 1000) - history.length + 1,
    kW: h.powerKw,
  }));

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="powerFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b9d4f" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#8b9d4f" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(90,94,65,0.12)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="s"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(90,94,65,0.55)", fontSize: 11 }}
            tickFormatter={(v: number) => `${v}s`}
            domain={["dataMin", 0]}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(90,94,65,0.55)", fontSize: 11 }}
            domain={[0, Math.max(60, Math.ceil(maxKw / 50) * 50)]}
            width={42}
            tickFormatter={(v: number) => `${v}`}
          />
          <Tooltip
            cursor={{ stroke: "rgba(90,94,65,0.3)" }}
            contentStyle={{
              background: "#f7f2e7",
              border: "1px solid rgba(90,94,65,0.2)",
              borderRadius: 10,
              color: "#5a5e41",
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value.toFixed(1)} kW`, "Potencia"]}
            labelFormatter={(label) => `t = ${label}s`}
          />
          <Area
            type="monotone"
            dataKey="kW"
            stroke="#8b9d4f"
            strokeWidth={2}
            fill="url(#powerFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
