import type { LucideIcon } from "lucide-react";

export type StatTone = "info" | "success" | "error" | "warning" | "neutral";

const toneClasses: Record<StatTone, string> = {
  info: "bg-info/15 text-info",
  success: "bg-success/15 text-success",
  error: "bg-error/15 text-error",
  warning: "bg-warning/15 text-warning",
  neutral: "bg-base-300 text-base-content",
};

export const chartColors: Record<StatTone, string> = {
  info: "#0284c7",
  success: "#16a34a",
  error: "#dc2626",
  warning: "#d97706",
  neutral: "#64748b",
};

type StatAvatarProps = {
  icon: LucideIcon;
  tone?: StatTone;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-12 w-12",
};

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export default function StatAvatar({
  icon: Icon,
  tone = "info",
  size = "md",
}: StatAvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl ${sizeClasses[size]} ${toneClasses[tone]}`}
    >
      <Icon className={iconSizes[size]} />
    </div>
  );
}
