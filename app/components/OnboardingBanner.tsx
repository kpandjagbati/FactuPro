"use client";

import { getOnboardingStatus } from "@/app/actions-v2";
import { Building2, CheckCircle2, FileText, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type OnboardingState = Awaited<ReturnType<typeof getOnboardingStatus>>;

export default function OnboardingBanner() {
  const [status, setStatus] = useState<OnboardingState | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getOnboardingStatus();
        setStatus(data);
        if (data.complete && localStorage.getItem("factupro-onboarding-done") !== "1") {
          localStorage.setItem("factupro-onboarding-done", "1");
        }
      } catch {
        /* ignore */
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (localStorage.getItem("factupro-onboarding-dismiss") === "1") {
      setDismissed(true);
    }
  }, []);

  if (!status || status.complete || dismissed) return null;

  const steps = [
    {
      done: status.hasCompany,
      label: "Configurer l'entreprise",
      href: "/entreprise",
      icon: Building2,
    },
    {
      done: status.hasClient,
      label: "Ajouter un client",
      href: "/clients",
      icon: Users,
    },
    {
      done: status.hasInvoice,
      label: "Créer une facture",
      href: "/invoices",
      icon: FileText,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="rounded-xl border border-info/30 bg-info/10 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">Premiers pas avec FactuPro</h2>
          <p className="text-sm text-base-content/70">
            {doneCount}/3 étapes — {status.progressLabel}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-xs"
          onClick={() => {
            localStorage.setItem("factupro-onboarding-dismiss", "1");
            setDismissed(true);
          }}
        >
          Masquer
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Link
              key={step.href}
              href={step.href}
              className={`flex items-center gap-2 rounded-lg p-3 text-sm transition ${
                step.done
                  ? "bg-success/15 text-success"
                  : "bg-base-100 hover:bg-base-200"
              }`}
            >
              {step.done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              ) : (
                <Icon className="h-5 w-5 shrink-0 text-info" />
              )}
              <span className={step.done ? "line-through opacity-80" : ""}>
                {step.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
