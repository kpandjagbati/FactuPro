"use client";

import React from "react";
import {
  Banknote,
  Building2,
  CreditCard,
  FileCheck2,
  HelpCircle,
} from "lucide-react";

interface PaymentLogoProps {
  method: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function MixxByYasLogo({
  size = "md",
  className = "",
  showText = false,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
}) {
  const iconSize = size === "sm" ? 24 : size === "lg" ? 40 : 30;

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none shrink-0 ${className}`}
      title="Mixx by Yas (Togocom)"
    >
      <div
        className="relative overflow-hidden rounded-lg shadow-sm border border-base-300 bg-white shrink-0 flex items-center justify-center p-0.5"
        style={{ width: iconSize, height: iconSize }}
      >
        <img
          src="/logos/mixx-by-yas.png"
          alt="Mixx by Yas"
          className="w-full h-full object-contain rounded-md"
        />
      </div>
      {showText && (
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold leading-tight text-base-content">
            Mixx by Yas
          </span>
          <span className="text-[10px] text-base-content/60 leading-tight">
            Togocom • TMoney
          </span>
        </div>
      )}
    </div>
  );
}

export function MoovMoneyLogo({
  size = "md",
  className = "",
  showText = false,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
}) {
  const iconSize = size === "sm" ? 24 : size === "lg" ? 40 : 30;

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none shrink-0 ${className}`}
      title="Moov Money (Moov Africa)"
    >
      <div
        className="relative overflow-hidden rounded-lg shadow-sm border border-base-300 bg-white shrink-0 flex items-center justify-center p-0.5"
        style={{ width: iconSize, height: iconSize }}
      >
        <img
          src="/logos/moov-money.png"
          alt="Moov Money"
          className="w-full h-full object-contain rounded-md"
        />
      </div>
      {showText && (
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold leading-tight text-base-content">
            Moov Money
          </span>
          <span className="text-[10px] text-base-content/60 leading-tight">
            Moov Africa • Flooz
          </span>
        </div>
      )}
    </div>
  );
}

export default function PaymentMethodLogo({
  method,
  size = "md",
  showLabel = false,
  className = "",
}: PaymentLogoProps) {
  const lower = (method || "").toLowerCase();

  if (
    lower.includes("mixx") ||
    lower.includes("yas") ||
    lower.includes("tmoney") ||
    lower.includes("togocom")
  ) {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <MixxByYasLogo size={size} />
        {showLabel && (
          <span className="text-xs font-semibold text-base-content">
            Mixx by Yas
          </span>
        )}
      </div>
    );
  }

  if (lower.includes("moov") || lower.includes("flooz")) {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <MoovMoneyLogo size={size} />
        {showLabel && (
          <span className="text-xs font-semibold text-base-content">
            Moov Money
          </span>
        )}
      </div>
    );
  }

  if (
    lower.includes("virement") ||
    lower.includes("bancaire") ||
    lower.includes("banque")
  ) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 text-xs text-base-content ${className}`}
      >
        <span className="flex items-center justify-center rounded-lg bg-info/15 text-info p-1.5">
          <Building2 className="h-4 w-4" />
        </span>
        {showLabel && <span className="font-semibold">Virement bancaire</span>}
      </div>
    );
  }

  if (lower.includes("espèce") || lower.includes("cash")) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 text-xs text-base-content ${className}`}
      >
        <span className="flex items-center justify-center rounded-lg bg-success/15 text-success p-1.5">
          <Banknote className="h-4 w-4" />
        </span>
        {showLabel && <span className="font-semibold">Espèces</span>}
      </div>
    );
  }

  if (lower.includes("chèque")) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 text-xs text-base-content ${className}`}
      >
        <span className="flex items-center justify-center rounded-lg bg-warning/15 text-warning p-1.5">
          <FileCheck2 className="h-4 w-4" />
        </span>
        {showLabel && <span className="font-semibold">Chèque</span>}
      </div>
    );
  }

  if (lower.includes("carte") || lower.includes("card")) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 text-xs text-base-content ${className}`}
      >
        <span className="flex items-center justify-center rounded-lg bg-secondary/15 text-secondary p-1.5">
          <CreditCard className="h-4 w-4" />
        </span>
        {showLabel && <span className="font-semibold">Carte bancaire</span>}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 text-xs text-base-content/70 ${className}`}
    >
      <HelpCircle className="h-4 w-4" />
      {showLabel && <span>{method}</span>}
    </div>
  );
}
