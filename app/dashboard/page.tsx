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
  Calculator,
  CreditCard,
  FileClock,
  FileMinus,
  FileText,
  Package,
  Receipt,
  Repeat,
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
            <Link href="/reports" className="btn btn-sm btn-ghost gap-1">
              <Calculator className="h-4 w-4" />
              Rapports
            </Link>
            <Link href="/recurring" className="btn btn-sm btn-ghost gap-1">
              <Repeat className="h-4 w-4" />
              Abonnements
            </Link>
            <Link href="/credit-notes" className="btn btn-sm btn-ghost gap-1">
              <FileMinus className="h-4 w-4" />
              Avoirs
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

        {stats && (stats.lowStockCount || 0) > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-warning/40 bg-warning/10 p-4 text-warning-content shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/20 p-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-base-content">
                  Alerte Stock : {stats.lowStockCount} article(s) en stock faible ou rupture
                </div>
                <div className="text-xs text-base-content/70">
                  Certains articles ont atteint leur seuil critique de réapprovisionnement.
                </div>
              </div>
            </div>
            <Link
              href="/products"
              className="btn btn-warning btn-sm shrink-0 font-medium"
            >
              Gérer le stock
            </Link>
          </div>
        )}

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
