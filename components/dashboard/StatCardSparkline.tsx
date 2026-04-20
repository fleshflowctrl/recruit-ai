"use client";

import { useMemo } from "react";

function calcPoints(data: number[], w = 80, h = 28, pad = 2): string {
  if (data.length === 0) return "";
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const denom = Math.max(data.length - 1, 1);
  return data
    .map((v, i) => {
      const x = data.length === 1 ? w / 2 : (i / denom) * w;
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

const VALUE_COLORS: Record<
  "default" | "green" | "amber" | "red",
  { num: string; stroke: string }
> = {
  default: { num: "#1A1A18", stroke: "#1A1A18" },
  green: { num: "#1A5C2A", stroke: "#5C8A5C" },
  amber: { num: "#7A5C10", stroke: "#C8A45A" },
  red: { num: "#8B2020", stroke: "#C05050" },
};

const TREND_BADGE: Record<
  "up" | "down" | "warn" | "flat",
  { bg: string; color: string }
> = {
  up: { bg: "#D4EDD8", color: "#1A5C2A" },
  down: { bg: "#F5D9D9", color: "#8B2020" },
  warn: { bg: "#F5EBC8", color: "#7A5C10" },
  flat: { bg: "#EFEDE8", color: "#8A8A85" },
};

const DEFAULT_SPARK = [52, 48, 55, 51, 58, 54, 53];

export type StatCardSparklineProps = {
  label: string;
  value: string | number;
  trend?: string;
  trendType?: "up" | "down" | "warn" | "flat";
  sparkData?: number[];
  valueColor?: "default" | "green" | "amber" | "red";
};

export function StatCardSparkline({
  label,
  value,
  trend,
  trendType = "flat",
  sparkData,
  valueColor = "default",
}: StatCardSparklineProps) {
  const data = useMemo(() => {
    if (sparkData && sparkData.length > 0) {
      const seven =
        sparkData.length >= 7
          ? sparkData.slice(0, 7)
          : [
              ...sparkData,
              ...Array(7 - sparkData.length).fill(
                sparkData[sparkData.length - 1] ?? 0,
              ),
            ];
      return seven;
    }
    return DEFAULT_SPARK;
  }, [sparkData]);

  const w = 80;
  const h = 28;
  const pad = 2;
  const linePoints = calcPoints(data, w, h, pad);
  const stroke = VALUE_COLORS[valueColor].stroke;
  const numColor = VALUE_COLORS[valueColor].num;
  const polygonPoints = `0,${h} ${linePoints} ${w},${h}`;
  const trendStyle = TREND_BADGE[trendType];

  return (
    <div className="min-w-0 rounded-[10px] border border-[rgba(0,0,0,0.06)] bg-[#F5F4F0] px-3 py-3 transition-all duration-150 hover:bg-[#EFEDE8] sm:px-4 sm:py-[14px]">
      <div className="flex items-start justify-between gap-2">
        <span
          className="text-[24px] font-medium leading-none"
          style={{
            fontFamily: "'SF Mono', ui-monospace, monospace",
            color: numColor,
          }}
        >
          {value}
        </span>
        {trend != null && trend !== "" && (
          <span
            className="shrink-0 rounded-[10px] px-1.5 py-0.5 text-[10px] font-semibold"
            style={{
              background: trendStyle.bg,
              color: trendStyle.color,
            }}
          >
            {trend}
          </span>
        )}
      </div>
      <p
        className="text-[11px] leading-[1.4] text-[#8A8A85]"
        style={{ margin: "6px 0 10px 0" }}
      >
        {label}
      </p>
      <svg
        className="w-full"
        height={28}
        viewBox="0 0 80 28"
        preserveAspectRatio="none"
        aria-hidden
      >
        <polygon
          points={polygonPoints}
          fill={stroke}
          fillOpacity={0.07}
        />
        <polyline
          points={linePoints}
          fill="none"
          stroke={stroke}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
