"use client";

import { getAdminOverview } from "@/app/actions-admin";
import {
  Building2,
  FileText,
  TrendingUp,
  Users,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Overview = Awaited<ReturnType<typeof getAdminOverview>>;

export default function AdminHomePage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setData(await getAdminOverview());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) {
    return <span className="loading loading-spinner loading-md text-info" />;
  }

  if (error || !data) {
    return (
      <div className="alert alert-error">
        <span>{error || "Accès refusé"}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Administration FactuPro</h1>
        <p className="text-base-content/70">
          Statistiques globales de la plateforme.
        </p>
      </div>

      {/* KPI principaux */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-base-200 p-5">
          <div className="flex items-center gap-2 text-sm opacity-70">
            <Users className="h-4 w-4" /> Utilisateurs
          </div>
          <div className="mt-2 text-3xl font-bold">{data.userCount}</div>
          <div className="mt-1 text-xs opacity-60">
            +{data.usersLast7} / 7j · +{data.usersLast30} / 30j
          </div>
        </div>
        <div className="rounded-xl bg-base-200 p-5">
          <div className="flex items-center gap-2 text-sm opacity-70">
            <Building2 className="h-4 w-4" /> Organisations
          </div>
          <div className="mt-2 text-3xl font-bold">{data.orgCount}</div>
        </div>
        <div className="rounded-xl bg-base-200 p-5">
          <div className="flex items-center gap-2 text-sm opacity-70">
            <FileText className="h-4 w-4" /> Factures
          </div>
          <div className="mt-2 text-3xl font-bold">{data.invoiceCount}</div>
          <div className="mt-1 text-xs opacity-60">
            +{data.invoicesLast7} / 7j · +{data.invoicesLast30} / 30j ·{" "}
            {data.quoteCount} devis
          </div>
        </div>
        <div className="rounded-xl bg-base-200 p-5">
          <div className="flex items-center gap-2 text-sm opacity-70">
            <Wallet className="h-4 w-4" /> CA encaissé
          </div>
          <div className="mt-2 text-2xl font-bold text-success">
            {data.paidTotalLabel}
          </div>
          <div className="mt-1 text-xs opacity-60">
            {data.paidCount} facture(s) payée(s)
          </div>
        </div>
      </div>

      {/* KPI secondaires */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-warning/30 bg-base-200 p-4">
          <div className="text-sm opacity-70">En attente de paiement</div>
          <div className="mt-1 text-xl font-bold">{data.pendingTotalLabel}</div>
          <div className="text-xs opacity-60">{data.sentCount} facture(s)</div>
        </div>
        <div className="rounded-xl border border-error/30 bg-base-200 p-4">
          <div className="flex items-center gap-1 text-sm opacity-70">
            <AlertTriangle className="h-3.5 w-3.5" /> Impayées
          </div>
          <div className="mt-1 text-xl font-bold text-error">
            {data.overdueTotalLabel}
          </div>
          <div className="text-xs opacity-60">{data.overdueCount} facture(s)</div>
        </div>
        <div className="rounded-xl border border-info/30 bg-base-200 p-4">
          <div className="flex items-center gap-1 text-sm opacity-70">
            <TrendingUp className="h-3.5 w-3.5" /> Conversion devis
          </div>
          <div className="mt-1 text-xl font-bold">{data.quoteConversionRate}%</div>
          <div className="text-xs opacity-60">
            {data.quotesConverted}/{data.quoteCount} convertis
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Répartition statuts */}
        <div className="rounded-xl bg-base-200 p-5">
          <h2 className="mb-4 font-bold">Répartition des factures</h2>
          <div className="space-y-3">
            {data.statusBreakdown.map((s) => (
              <div key={s.key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{s.label}</span>
                  <span className="font-medium">
                    {s.count} ({s.percent}%)
                  </span>
                </div>
                <progress
                  className={`progress w-full ${
                    s.color === "success"
                      ? "progress-success"
                      : s.color === "warning"
                        ? "progress-warning"
                        : s.color === "error"
                          ? "progress-error"
                          : s.color === "info"
                            ? "progress-info"
                            : "progress-neutral"
                  }`}
                  value={s.percent}
                  max={100}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Activité mensuelle */}
        <div className="rounded-xl bg-base-200 p-5">
          <h2 className="mb-4 font-bold">Activité (6 derniers mois)</h2>
          <div className="flex h-40 items-end gap-2">
            {data.monthlyActivity.map((m) => (
              <div
                key={m.key}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <div className="flex h-28 w-full items-end justify-center gap-0.5">
                  <div
                    className="w-1/2 rounded-t bg-info"
                    style={{
                      height: `${Math.max(
                        4,
                        (m.invoices / data.maxMonthlyInvoices) * 100,
                      )}%`,
                    }}
                    title={`${m.invoices} factures`}
                  />
                  <div
                    className="w-1/2 rounded-t bg-neutral"
                    style={{
                      height: `${Math.max(
                        4,
                        (m.signups / data.maxMonthlySignups) * 100,
                      )}%`,
                    }}
                    title={`${m.signups} inscriptions`}
                  />
                </div>
                <span className="text-[10px] opacity-70">{m.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-xs opacity-70">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-info" />{" "}
              Factures
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-neutral" />{" "}
              Inscriptions
            </span>
          </div>
          <div className="mt-4 space-y-1 text-sm">
            {data.monthlyActivity.map((m) => (
              <div key={`rev-${m.key}`} className="flex justify-between">
                <span className="opacity-70">{m.label}</span>
                <span className="font-medium">{m.revenueLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top orgs */}
      <div className="rounded-xl bg-base-200 p-5">
        <h2 className="mb-3 font-bold">Top organisations (CA)</h2>
        {data.topOrganizations.length === 0 ? (
          <p className="text-sm opacity-60">Pas encore de données.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Organisation</th>
                  <th>Factures</th>
                  <th>CA encaissé</th>
                </tr>
              </thead>
              <tbody>
                {data.topOrganizations.map((o) => (
                  <tr key={o.name}>
                    <td className="font-medium">{o.name}</td>
                    <td>{o.invoiceCount}</td>
                    <td>{o.revenueLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Link href="/admin/users" className="btn btn-sm btn-neutral">
          Voir les utilisateurs
        </Link>
        <Link href="/admin/invoices" className="btn btn-sm btn-ghost">
          Voir les factures
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-base-200 p-5">
          <h2 className="mb-3 font-bold">Derniers utilisateurs</h2>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Organisation</th>
                </tr>
              </thead>
              <tbody>
                {data.users.slice(0, 8).map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td className="text-xs">{u.email}</td>
                    <td>{u.organization}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl bg-base-200 p-5">
          <h2 className="mb-3 font-bold">Dernières factures</h2>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Org</th>
                  <th>Statut</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.recentInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="text-xs">{inv.number}</td>
                    <td>{inv.organization}</td>
                    <td>
                      <span className="badge badge-ghost badge-sm">
                        {inv.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap font-medium">
                      {inv.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
