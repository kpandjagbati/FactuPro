import type { LucideIcon } from "lucide-react";
import StatAvatar, { type StatTone } from "./StatAvatar";

type Item = {
  title: string;
  stats: string;
  icon: LucideIcon;
  tone?: StatTone;
};

type Props = {
  title?: string;
  caption?: string;
  items: Item[];
};

/** Inspiré de StatisticsCard (Vuexy) — 4 KPI dans une carte */
export default function StatisticsCard({
  title = "Statistiques",
  caption,
  items,
}: Props) {
  return (
    <div className="rounded-xl bg-base-200 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold">{title}</h2>
        {caption ? (
          <span className="text-xs text-base-content/50">{caption}</span>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="flex items-center gap-3">
            <StatAvatar icon={item.icon} tone={item.tone || "info"} size="sm" />
            <div>
              <p className="text-lg font-bold leading-tight">{item.stats}</p>
              <p className="text-sm text-base-content/65">{item.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
