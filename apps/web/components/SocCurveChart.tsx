"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function SocCurveChart({
  history,
  target,
}: {
  history: Array<{ t: number; socPct: number }>;
  target: number;
}) {
  const t0 = history[0]?.t ?? Date.now();
  const data = history.map((h) => ({
    s: Math.round((h.t - t0) / 1000) - history.length + 1,
    soc: h.socPct,
  }));
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
            domain={[0, 100]}
            width={36}
            tickFormatter={(v: number) => `${v}%`}
          />
          <ReferenceLine y={target} stroke="#c4a86e" strokeDasharray="4 4" />
          <Tooltip
            cursor={{ stroke: "rgba(90,94,65,0.3)" }}
            contentStyle={{
              background: "#f7f2e7",
              border: "1px solid rgba(90,94,65,0.2)",
              borderRadius: 10,
              color: "#5a5e41",
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, "SoC"]}
            labelFormatter={(label) => `t = ${label}s`}
          />
          <Line
            type="monotone"
            dataKey="soc"
            stroke="#5a5e41"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
