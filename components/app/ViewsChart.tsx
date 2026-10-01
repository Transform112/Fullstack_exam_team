"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/card";

export type ViewsChartPoint = { date: string; views: number };
export type ViewsChartProps = { data: ViewsChartPoint[] };

// Short axis label such as "14 Oct" for a YYYY-MM-DD day key.
function dayLabel(value: unknown) {
  const raw = String(value);
  const parsed = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" });
}

// Area chart of the last 30 days of views from EP-25 (docs/03 P4-10).
export function ViewsChart({ data }: ViewsChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const total = data.reduce((sum, point) => sum + point.views, 0);

  // ResponsiveContainer can only measure after mount, so the first paint is a skeleton.
  if (!mounted) return <Skeleton className="h-[280px] w-full" />;

  if (data.length === 0 || total === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-border px-6 text-center text-sm text-muted">
        No views yet. Share your link to see the graph grow.
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="wishly-views-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#442B46" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#442B46" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4DDD1" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={dayLabel}
            interval={6}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11, fill: "#6B6480" }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={36}
            tick={{ fontSize: 11, fill: "#6B6480" }}
          />
          <Tooltip labelFormatter={dayLabel} />
          <Area
            type="monotone"
            dataKey="views"
            name="Views"
            stroke="#442B46"
            strokeWidth={2}
            fill="url(#wishly-views-fill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
