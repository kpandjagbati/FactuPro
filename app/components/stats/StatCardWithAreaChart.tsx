"use client";

import type { LucideIcon } from "lucide-react";
import type { ApexOptions } from "apexcharts";
import ApexChart from "./ApexChart";
import StatAvatar, { chartColors, type StatTone } from "./StatAvatar";

type Props = {
  title: string;
  stats: string;
  icon: LucideIcon;
  tone?: StatTone;
  series: number[];
};

/** Inspiré de StatsWithAreaChart (Vuexy) */
export default function StatCardWithAreaChart({
  title,
  stats,
  icon,
  tone = "info",
  series,
}: Props) {
  const color = chartColors[tone];

  const options: ApexOptions = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false },
      sparkline: { enabled: true },
      background: "transparent",
    },
    tooltip: { enabled: false },
    dataLabels: { enabled: false },
    stroke: { width: 2.5, curve: "smooth", colors: [color] },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 100],
        colorStops: [
          [
            { offset: 0, color, opacity: 0.4 },
            { offset: 100, color, opacity: 0.05 },
          ],
        ],
      },
    },
    colors: [color],
    grid: { show: false, padding: { bottom: 8 } },
    xaxis: {
      labels: { show: false },
      axisTicks: { show: false },
      axisBorder: { show: false },
    },
    yaxis: { show: false },
  };

  return (
    <div className="overflow-hidden rounded-xl bg-base-200">
      <div className="flex flex-col gap-2 p-5 pb-2">
        <StatAvatar icon={icon} tone={tone} />
        <div>
          <p className="text-2xl font-bold">{stats}</p>
          <p className="text-sm text-base-content/65">{title}</p>
        </div>
      </div>
      <ApexChart
        type="area"
        height={88}
        width="100%"
        options={options}
        series={[{ data: series.length ? series : [0, 0, 0, 0, 0, 0] }]}
      />
    </div>
  );
}
