"use client";

import type { ApexOptions } from "apexcharts";
import { formatMoney } from "@/lib/format";
import ApexChart from "./ApexChart";
import { chartColors } from "./StatAvatar";

type Props = {
  labels: string[];
  values: number[];
  currency: string;
  title?: string;
};

/** Inspiré de BarChartRevenueGrowth (Vuexy) */
export default function RevenueGrowthChart({
  labels,
  values,
  currency,
  title = "CA encaissé (6 mois)",
}: Props) {
  const color = chartColors.success;
  const soft = "rgba(22, 163, 74, 0.22)";
  const maxIdx = values.reduce(
    (best, v, i, arr) => (v >= (arr[best] || 0) ? i : best),
    0,
  );
  const total = values.reduce((a, b) => a + b, 0);

  const options: ApexOptions = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false },
      background: "transparent",
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        distributed: true,
        columnWidth: "48%",
      },
    },
    legend: { show: false },
    tooltip: {
      y: {
        formatter: (val) => formatMoney(val, currency),
      },
    },
    dataLabels: { enabled: false },
    colors: values.map((_, i) => (i === maxIdx ? color : soft)),
    states: {
      hover: { filter: { type: "none" } },
      active: { filter: { type: "none" } },
    },
    grid: {
      show: false,
      padding: { top: -10, left: 0, right: 0, bottom: -5 },
    },
    xaxis: {
      categories: labels,
      axisTicks: { show: false },
      axisBorder: { show: false },
      labels: {
        style: { colors: "var(--color-base-content)", fontSize: "12px" },
      },
    },
    yaxis: { show: false },
  };

  return (
    <div className="rounded-xl bg-base-200 p-5">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-base-content/65">{title}</p>
          <p className="text-2xl font-bold text-success">
            {formatMoney(total, currency)}
          </p>
        </div>
        <span className="badge badge-success badge-outline badge-sm">6 mois</span>
      </div>
      <ApexChart
        type="bar"
        height={180}
        width="100%"
        options={options}
        series={[{ name: "CA", data: values.length ? values : [0] }]}
      />
    </div>
  );
}
