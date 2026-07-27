import type { LucideIcon } from "lucide-react";
import StatAvatar, { type StatTone } from "./StatAvatar";

type Props = {
  stats: string;
  title: string;
  icon: LucideIcon;
  tone?: StatTone;
};

/** Inspiré de CardStatsSquare (Vuexy) */
export default function StatCardSquare({
  stats,
  title,
  icon,
  tone = "info",
}: Props) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-base-200 p-5 text-center">
      <StatAvatar icon={icon} tone={tone} size="lg" />
      <p className="text-2xl font-bold">{stats}</p>
      <p className="text-sm text-base-content/65">{title}</p>
    </div>
  );
}
