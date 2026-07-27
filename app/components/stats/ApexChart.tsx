"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="flex h-24 items-center justify-center">
      <span className="loading loading-spinner loading-sm text-info" />
    </div>
  ),
});

type Props = ComponentProps<typeof import("react-apexcharts").default>;

export default function ApexChart(props: Props) {
  return <ReactApexChart {...props} />;
}
