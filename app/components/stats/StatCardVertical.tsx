import type { LucideIcon } from "lucide-react";
import StatAvatar, { type StatTone } from "./StatAvatar";

type Props = {
  title: string;
  subtitle: string;
  stats: string;
  chip: string;
  icon: LucideIcon;
  tone?: StatTone;
};

/** Inspiré de CardStatsVertical (Vuexy) */
export default function StatCardVertical({
  title,
  subtitle,
  stats,
  chip,
  icon,
  tone = "info",
}: Props) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-xl bg-base-200 p-5">
      <StatAvatar icon={icon} tone={tone} size="lg" />
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-base-content/55">{subtitle}</p>
        <p className="text-xl font-bold">{stats}</p>
      </div>
      <span className={`badge badge-sm badge-${tone === "neutral" ? "ghost" : tone}`}>
        {chip}
      </span>
    </div>
  );
}
