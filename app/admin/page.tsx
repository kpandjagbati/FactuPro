"use client";

import { getAdminOverview } from "@/app/actions-admin";
import RevenueGrowthChart from "@/app/components/stats/RevenueGrowthChart";
import StatCardHorizontal from "@/app/components/stats/StatCardHorizontal";
import StatCardWithAreaChart from "@/app/components/stats/StatCardWithAreaChart";
import StatisticsCard from "@/app/components/stats/StatisticsCard";
import StatusDonutChart from "@/app/components/stats/StatusDonutChart";
import {
  AlertTriangle,
  Building2,
  FileText,
  Quote,
  TrendingUp,
  Users,
  Wallet,
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

      <StatisticsCard
        title="Vue d'ensemble plateforme"
        caption="Temps réel"
        items={[
          {
            title: "Utilisateurs",
            stats: String(data.userCount),
            icon: Users,
            tone: "info",
          },
          {
            title: "Organisations",
            stats: String(data.orgCount),
            icon: Building2,
            tone: "neutral",
          },
          {
            title: "Factures",
            stats: String(data.invoiceCount),
            icon: FileText,
            tone: "warning",
          },
          {
            title: "CA encaissé",
            stats: data.paidTotalLabel,
            icon: Wallet,
            tone: "success",
          },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardHorizontal
          title="Utilisateurs"
          stats={String(data.userCount)}
          subtitle={`+${data.usersLast7} / 7j · +${data.usersLast30} / 30j · Dernier accès : ${data.latestSignupLabel}`}
          icon={Users}
          tone="info"
        />
        <StatCardHorizontal
          title="Factures"
          stats={String(data.invoiceCount)}
          subtitle={`+${data.invoicesLast7} / 7j · ${data.quoteCount} devis`}
          icon={FileText}
          tone="warning"
        />
        <StatCardHorizontal
          title="Impayées"
          stats={data.overdueTotalLabel}
          subtitle={`${data.overdueCount} facture(s)`}
          icon={AlertTriangle}
          tone="error"
        />
        <StatCardHorizontal
          title="Conversion devis"
          stats={`${data.quoteConversionRate}%`}
          subtitle={`${data.quotesConverted}/${data.quoteCount} convertis`}
          icon={TrendingUp}
          tone="success"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueGrowthChart
            title="CA plateforme (6 mois)"
            labels={data.monthlyActivity.map((m) => m.label)}
            values={data.monthlyActivity.map((m) => m.revenue)}
            currency="XOF"
          />
        </div>
        <StatusDonutChart
          title="Répartition des factures"
          items={data.statusBreakdown.map((s) => ({
            label: s.label,
            count: s.count,
          }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardWithAreaChart
          title="Factures / mois"
          stats={String(data.invoiceCount)}
          icon={FileText}
          tone="info"
          series={data.monthlyActivity.map((m) => m.invoices)}
        />
        <StatCardWithAreaChart
          title="Inscriptions / mois"
          stats={String(data.userCount)}
          icon={Users}
          tone="neutral"
          series={data.monthlyActivity.map((m) => m.signups)}
        />
        <StatCardWithAreaChart
          title="CA mensuel"
          stats={data.paidTotalLabel}
          icon={Wallet}
          tone="success"
          series={data.monthlyActivity.map((m) => m.revenue)}
        />
        <StatCardWithAreaChart
          title="Devis"
          stats={String(data.quoteCount)}
          icon={Quote}
          tone="warning"
          series={data.monthlyActivity.map((m) => m.invoices)}
        />
      </div>

      <div className="rounded-xl bg-base-200 p-5">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold">Accès à la plateforme</h2>
            <p className="text-sm text-base-content/65">
              Date de première connexion / inscription de chaque utilisateur
            </p>
          </div>
          <span className="badge badge-info badge-outline">
            Dernier accès : {data.latestSignupLabel}
          </span>
        </div>

        {data.users.length === 0 ? (
          <p className="text-sm opacity-60">Aucun utilisateur inscrit.</p>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {data.users.map((u) => (
                <div key={u.id} className="rounded-lg border border-base-300 p-3">
                  <p className="font-semibold">{u.name}</p>
                  <p className="truncate text-xs text-base-content/65">{u.email}</p>
                  <div className="mt-2 flex justify-between gap-2 text-sm">
                    <span className="truncate">{u.organization}</span>
                    <span className="shrink-0 font-medium text-info">
                      {u.joinedAtLabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Organisation</th>
                    <th>Accès depuis</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u) => (
                    <tr key={u.id}>
                      <td className="font-medium">{u.name}</td>
                      <td className="text-xs">{u.email}</td>
                      <td>{u.organization}</td>
                      <td className="whitespace-nowrap font-medium text-info">
                        {u.joinedAtLabel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
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
            <Building2 className="h-3.5 w-3.5" /> Organisations
          </div>
          <div className="mt-1 text-xl font-bold">{data.orgCount}</div>
          <div className="text-xs opacity-60">comptes actifs</div>
        </div>
      </div>

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
                  <th>Accès depuis</th>
                </tr>
              </thead>
              <tbody>
                {data.users.slice(0, 8).map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td className="text-xs">{u.email}</td>
                    <td>{u.organization}</td>
                    <td className="whitespace-nowrap text-sm text-info">
                      {u.joinedAtLabel}
                    </td>
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
