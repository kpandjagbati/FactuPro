import type { LucideIcon } from "lucide-react";
import StatAvatar, { type StatTone } from "./StatAvatar";

type Props = {
  title: string;
  stats: string;
  icon: LucideIcon;
  tone?: StatTone;
  subtitle?: string;
  trend?: string;
  trendPositive?: boolean;
};

/** Inspiré de Horizontal / HorizontalWithSubtitle (Vuexy) */
export default function StatCardHorizontal({
  title,
  stats,
  icon,
  tone = "info",
  subtitle,
  trend,
  trendPositive = true,
}: Props) {
  return (
    <div className="rounded-xl bg-base-200 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm text-base-content/70">{title}</p>
          <div className="flex flex-wrap items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight">{stats}</p>
            {trend ? (
              <span
                className={`text-sm font-medium ${trendPositive ? "text-success" : "text-error"}`}
              >
                {trend}
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <p className="text-xs text-base-content/55">{subtitle}</p>
          ) : null}
        </div>
        <StatAvatar icon={icon} tone={tone} />
      </div>
    </div>
  );
}
