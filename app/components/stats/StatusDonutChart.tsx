"use client";

import type { ApexOptions } from "apexcharts";
import ApexChart from "./ApexChart";
import { chartColors } from "./StatAvatar";

type Item = { label: string; count: number };

type Props = {
  items: Item[];
  title?: string;
};

/** Donut statut factures — style widget Vuexy */
export default function StatusDonutChart({
  items,
  title = "Répartition des factures",
}: Props) {
  const labels = items.map((i) => i.label);
  const series = items.map((i) => i.count);
  const total = series.reduce((a, b) => a + b, 0);

  const colors = [
    chartColors.neutral,
    chartColors.warning,
    chartColors.success,
    chartColors.error,
    "#94a3b8",
  ];

  const options: ApexOptions = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false },
      background: "transparent",
    },
    labels,
    colors,
    legend: {
      position: "bottom",
      fontSize: "12px",
      labels: { colors: "var(--color-base-content)" },
    },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: { show: true },
            value: {
              show: true,
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--color-base-content)",
            },
            total: {
              show: true,
              label: "Total",
              color: "var(--color-base-content)",
              formatter: () => String(total),
            },
          },
        },
      },
    },
    tooltip: {
      y: { formatter: (val) => `${val} facture(s)` },
    },
  };

  return (
    <div className="rounded-xl bg-base-200 p-5">
      <h2 className="mb-2 font-bold">{title}</h2>
      {total === 0 ? (
        <p className="py-10 text-center text-sm text-base-content/55">
          Pas encore de factures.
        </p>
      ) : (
        <ApexChart
          type="donut"
          height={280}
          width="100%"
          options={options}
          series={series}
        />
      )}
    </div>
  );
}
