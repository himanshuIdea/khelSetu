"use client";

import { useCallback, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CashIcon } from "@/components/academy/icons";
import { EmptyState, SectionTitle } from "@/components/academy/shared";
import { formatPaise } from "@/lib/format";
import type { FeeTrendChart, FeeTrendPoint, TrendMonths } from "@/lib/repositories/dashboard";

const PERIOD_OPTIONS: { months: TrendMonths; label: string }[] = [
  { months: 3, label: "3 months" },
  { months: 6, label: "6 months" },
  { months: 12, label: "12 months" },
];

type FeeTrendChartProps = {
  feeTrend: FeeTrendPoint[];
  feeChart: FeeTrendChart;
  trendMonths: TrendMonths;
};

type TooltipState = {
  x: number;
  y: number;
  label: string;
  amount: string;
};

export function FeeTrendChart({ feeTrend, feeChart, trendMonths }: FeeTrendChartProps) {
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const hasFeeData = feeTrend.some((point) => point.amountPaise > 0);

  const showTooltip = useCallback(
    (index: number, clientX: number, clientY: number) => {
      const point = feeTrend[index];
      const coord = feeChart.coords[index];
      if (!point || !coord || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      setTooltip({
        x: clientX - rect.left,
        y: clientY - rect.top - 12,
        label: point.label,
        amount: formatPaise(point.amountPaise),
      });
    },
    [feeTrend, feeChart.coords]
  );

  function setPeriod(months: TrendMonths) {
    if (months === trendMonths) return;
    router.push(`${pathname}?months=${months}`);
  }

  return (
    <div className="bg-card border border-line rounded-(--radius) px-5 py-[18px]">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-1.5">
        <SectionTitle title="Fee collection trend" />
        <div className="flex gap-1 p-0.5 rounded-[9px] border border-line bg-surface/60 w-full sm:w-fit">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.months}
              type="button"
              onClick={() => setPeriod(option.months)}
              className={`flex-1 sm:flex-none min-h-[32px] px-3 rounded-[7px] text-[11px] font-semibold transition-colors ${
                trendMonths === option.months
                  ? "bg-card text-ink shadow-card border border-line"
                  : "text-muted hover:text-ink"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="text-[11.5px] text-muted mb-1.5">Monthly fees collected (₹ lakh)</div>

      {!hasFeeData ? (
        <EmptyState
          compact
          className="border-none shadow-none bg-transparent"
          icon={<CashIcon className="w-5 h-5" />}
          title="No fee data yet"
          description="Fee collection trends appear when players are onboarded with their monthly fee."
        />
      ) : (
        <div ref={containerRef} className="relative">
          {tooltip && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-[8px] border border-line bg-card px-2.5 py-1.5 text-[11px] shadow-card whitespace-nowrap"
              style={{ left: tooltip.x, top: tooltip.y }}
            >
              <div className="font-semibold text-ink">{tooltip.label}</div>
              <div className="text-muted">{tooltip.amount}</div>
            </div>
          )}
          <svg viewBox="0 0 560 196" width="100%" height="196">
            <g stroke="#EDF0F6" strokeWidth="1">
              <line x1="40" y1="20" x2="552" y2="20" />
              <line x1="40" y1="62" x2="552" y2="62" />
              <line x1="40" y1="104" x2="552" y2="104" />
              <line x1="40" y1="146" x2="552" y2="146" />
            </g>
            <g fill="#9AA4B8" fontSize="10" fontFamily="Poppins">
              {feeChart.yLabels.map((label, i) => (
                <text key={label} x="14" y={24 + i * 42}>
                  {label}
                </text>
              ))}
            </g>
            <defs>
              <linearGradient id="feeArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FF6B2C" stopOpacity=".24" />
                <stop offset="1" stopColor="#FF6B2C" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={feeChart.areaPath} fill="url(#feeArea)" />
            <path
              d={feeChart.linePath}
              fill="none"
              stroke="#FF6B2C"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <g fill="#FF6B2C">
              {feeChart.coords.map((point, i) => (
                <g key={point.label}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={12}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={(e) => showTooltip(i, e.clientX, e.clientY)}
                    onMouseMove={(e) => showTooltip(i, e.clientX, e.clientY)}
                    onMouseLeave={() => setTooltip(null)}
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={i === feeChart.coords.length - 1 ? 5 : 4}
                    stroke={i === feeChart.coords.length - 1 ? "#fff" : undefined}
                    strokeWidth={i === feeChart.coords.length - 1 ? 2 : undefined}
                    pointerEvents="none"
                  />
                </g>
              ))}
            </g>
            <g fill="#6B7790" fontSize="10.5" fontFamily="Poppins" textAnchor="middle">
              {feeChart.coords.map((point) => (
                <text key={point.label} x={point.x} y="186">
                  {point.label}
                </text>
              ))}
            </g>
          </svg>
        </div>
      )}
    </div>
  );
}
