"use client";

import { getDashboardStats } from "@/app/actions-v2";
import { exportDashboardExcel } from "@/app/actions-export";
import InvoiceComponent from "@/app/components/InvoiceComponent";
import ExportExcelButton from "@/app/components/ExportExcelButton";
import OnboardingBanner from "@/app/components/OnboardingBanner";
import Wrapper from "@/app/components/Wrapper";
import { formatMoney } from "@/lib/format";
import type { DashboardStats } from "@/type";
import {
  AlertTriangle,
  ArrowUpRight,
  CreditCard,
  FileClock,
  FileText,
  Package,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setStats(await getDashboardStats());
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <Wrapper>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Tableau de bord
            </h1>
            <p className="text-xs sm:text-sm text-base-content/60">
              Vue d&apos;ensemble de votre activité, rentabilité et facturation.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!loading && stats && (
              <ExportExcelButton
                exportFn={exportDashboardExcel}
                label="Rapport Excel"
              />
            )}
            <Link href="/products" className="btn btn-sm btn-ghost gap-1">
              <Package className="h-4 w-4" />
              Catalogue
            </Link>
            <Link href="/expenses" className="btn btn-sm btn-ghost gap-1">
              <Receipt className="h-4 w-4" />
              Dépenses
            </Link>
            <Link href="/invoices" className="btn btn-sm btn-ghost">
              Factures
            </Link>
            <Link href="/quotes" className="btn btn-sm btn-info">
              Devis
            </Link>
          </div>
        </div>

        <OnboardingBanner />

        {loading || !stats ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-lg text-info" />
          </div>
        ) : (
          <>
            {/* KPI Principaux */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* CA Encaissé */}
              <div className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm">
                <div className="flex items-center justify-between text-base-content/60">
                  <span className="text-xs font-semibold uppercase">CA Encaissé</span>
                  <Wallet className="h-4 w-4 text-info" />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-info">
                  {formatMoney(stats.paidTotal, stats.currency)}
                </div>
                <div className="mt-1 text-xs text-base-content/60">
                  Total factures payées
                </div>
              </div>

              {/* Dépenses Totales */}
              <div className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm">
                <div className="flex items-center justify-between text-base-content/60">
                  <span className="text-xs font-semibold uppercase">Dépenses</span>
                  <TrendingDown className="h-4 w-4 text-error" />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-error">
                  {formatMoney(stats.totalExpenses, stats.currency)}
                </div>
                <div className="mt-1 text-xs text-base-content/60">
                  Charges opérationnelles
                </div>
              </div>

              {/* Marge / Bénéfice Net */}
              <div className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm">
                <div className="flex items-center justify-between text-base-content/60">
                  <span className="text-xs font-semibold uppercase">Bénéfice Net</span>
                  <TrendingUp
                    className={`h-4 w-4 ${
                      stats.netMargin >= 0 ? "text-success" : "text-error"
                    }`}
                  />
                </div>
                <div
                  className={`mt-2 text-2xl font-extrabold ${
                    stats.netMargin >= 0 ? "text-success" : "text-error"
                  }`}
                >
                  {formatMoney(stats.netMargin, stats.currency)}
                </div>
                <div className="mt-1 text-xs text-base-content/60">
                  CA encaissé - Dépenses
                </div>
              </div>

              {/* Impayées / En attente */}
              <div className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm">
                <div className="flex items-center justify-between text-base-content/60">
                  <span className="text-xs font-semibold uppercase">En attente / Retard</span>
                  <AlertTriangle className="h-4 w-4 text-warning" />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-warning">
                  {formatMoney(
                    stats.pendingTotal + stats.overdueTotal,
                    stats.currency,
                  )}
                </div>
                <div className="mt-1 text-xs text-base-content/60">
                  {stats.pendingCount + stats.overdueCount} facture(s) à recouvrer
                </div>
              </div>
            </div>

            {/* Évolution mensuelle CA vs Dépenses */}
            <div className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-base">Activité des 6 derniers mois</h2>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded bg-info inline-block" /> CA encaissé
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded bg-error/70 inline-block" /> Dépenses
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-2 pt-4">
                {stats.monthlyRevenue.map((m, index) => {
                  const exp = stats.monthlyExpenses[index]?.total || 0;
                  const maxVal = Math.max(
                    ...stats.monthlyRevenue.map((r) => r.total),
                    ...stats.monthlyExpenses.map((e) => e.total),
                    1,
                  );
                  const revHeight = Math.min(100, Math.round((m.total / maxVal) * 100));
                  const expHeight = Math.min(100, Math.round((exp / maxVal) * 100));

                  return (
                    <div key={m.label} className="flex flex-col items-center gap-2">
                      <div className="h-28 w-full flex items-end justify-center gap-1.5 bg-base-200/50 rounded-lg p-1">
                        <div
                          className="w-3.5 bg-info rounded-t transition-all"
                          style={{ height: `${Math.max(4, revHeight)}%` }}
                          title={`CA : ${formatMoney(m.total, stats.currency)}`}
                        />
                        <div
                          className="w-3.5 bg-error/70 rounded-t transition-all"
                          style={{ height: `${Math.max(4, expHeight)}%` }}
                          title={`Dépenses : ${formatMoney(exp, stats.currency)}`}
                        />
                      </div>
                      <span className="text-xs font-semibold capitalize text-base-content/70">
                        {m.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Clients & Factures Récentes */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm">
                <h2 className="mb-3 font-bold text-base">Top clients (Volume facturé)</h2>
                {stats.topClients.length === 0 ? (
                  <p className="text-sm opacity-70 py-6 text-center">Pas encore de données.</p>
                ) : (
                  <ul className="space-y-3">
                    {stats.topClients.map((client, i) => (
                      <li
                        key={client.name}
                        className="flex items-center justify-between border-b border-base-200 pb-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-base-200 text-xs font-bold">
                            {i + 1}
                          </span>
                          <span className="font-medium">{client.name}</span>
                        </div>
                        <span className="font-bold text-info">
                          {formatMoney(client.total, stats.currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-base">Factures récentes</h2>
                  <Link href="/invoices" className="text-xs text-info hover:underline">
                    Voir tout →
                  </Link>
                </div>
                <div className="grid gap-2">
                  {stats.recentInvoices.length === 0 ? (
                    <p className="text-sm opacity-70 py-6 text-center">Aucune facture enregistrée.</p>
                  ) : (
                    stats.recentInvoices.map((invoice) => (
                      <InvoiceComponent key={invoice.id} invoice={invoice} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Wrapper>
  );
}
