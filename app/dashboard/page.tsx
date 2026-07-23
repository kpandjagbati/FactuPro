"use client";

import { getDashboardStats } from "@/app/actions-v2";
import InvoiceComponent from "@/app/components/InvoiceComponent";
import Wrapper from "@/app/components/Wrapper";
import { formatMoney } from "@/lib/format";
import type { DashboardStats } from "@/type";
import {
  AlertTriangle,
  FileText,
  FileClock,
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
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Dashboard</h1>
          <div className="flex gap-2">
            <Link href="/" className="btn btn-sm btn-ghost">
              Factures
            </Link>
            <Link href="/quotes" className="btn btn-sm btn-info">
              Devis
            </Link>
          </div>
        </div>

        {loading || !stats ? (
          <span className="loading loading-spinner loading-md text-info" />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-base-200 p-5">
                <div className="flex items-center gap-2 text-sm opacity-70">
                  <Wallet className="h-4 w-4" /> CA encaissé
                </div>
                <div className="mt-2 text-2xl font-bold text-success">
                  {formatMoney(stats.paidTotal, stats.currency)}
                </div>
              </div>
              <div className="rounded-xl bg-base-200 p-5">
                <div className="flex items-center gap-2 text-sm opacity-70">
                  <AlertTriangle className="h-4 w-4" /> Impayées
                </div>
                <div className="mt-2 text-2xl font-bold text-error">
                  {stats.overdueCount}
                </div>
                <div className="text-sm opacity-70">
                  {formatMoney(stats.overdueTotal, stats.currency)}
                </div>
              </div>
              <div className="rounded-xl bg-base-200 p-5">
                <div className="flex items-center gap-2 text-sm opacity-70">
                  <FileClock className="h-4 w-4" /> En attente
                </div>
                <div className="mt-2 text-2xl font-bold">{stats.pendingCount}</div>
              </div>
              <div className="rounded-xl bg-base-200 p-5">
                <div className="flex items-center gap-2 text-sm opacity-70">
                  <FileText className="h-4 w-4" /> Documents
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {stats.invoiceCount} fac. / {stats.quoteCount} dev.
                </div>
                <div className="text-sm opacity-70">
                  {stats.draftCount} brouillon(s)
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl bg-base-200 p-5">
                <h2 className="mb-3 font-bold">Top clients</h2>
                {stats.topClients.length === 0 ? (
                  <p className="text-sm opacity-70">Pas encore de données.</p>
                ) : (
                  <ul className="space-y-2">
                    {stats.topClients.map((client) => (
                      <li
                        key={client.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{client.name}</span>
                        <span className="font-semibold">
                          {formatMoney(client.total, stats.currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h2 className="mb-3 font-bold">Factures récentes</h2>
                <div className="grid gap-3">
                  {stats.recentInvoices.length === 0 ? (
                    <p className="text-sm opacity-70">Aucune facture.</p>
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
