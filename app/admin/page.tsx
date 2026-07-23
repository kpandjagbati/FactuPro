"use client";

import { getAdminOverview } from "@/app/actions-admin";
import { Building2, FileText, Users, Wallet } from "lucide-react";
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
          Vue globale de la plateforme (tous les comptes utilisateurs).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-base-200 p-5">
          <div className="flex items-center gap-2 text-sm opacity-70">
            <Users className="h-4 w-4" /> Utilisateurs
          </div>
          <div className="mt-2 text-3xl font-bold">{data.userCount}</div>
        </div>
        <div className="rounded-xl bg-base-200 p-5">
          <div className="flex items-center gap-2 text-sm opacity-70">
            <Building2 className="h-4 w-4" /> Organisations
          </div>
          <div className="mt-2 text-3xl font-bold">{data.orgCount}</div>
        </div>
        <div className="rounded-xl bg-base-200 p-5">
          <div className="flex items-center gap-2 text-sm opacity-70">
            <FileText className="h-4 w-4" /> Documents
          </div>
          <div className="mt-2 text-3xl font-bold">
            {data.invoiceCount} fac. / {data.quoteCount} dev.
          </div>
          <div className="text-xs opacity-60">
            {data.draftCount} brouillons · {data.sentCount} en attente ·{" "}
            {data.overdueCount} impayées
          </div>
        </div>
        <div className="rounded-xl bg-base-200 p-5">
          <div className="flex items-center gap-2 text-sm opacity-70">
            <Wallet className="h-4 w-4" /> CA encaissé
          </div>
          <div className="mt-2 text-2xl font-bold text-success">
            {data.paidTotalLabel}
          </div>
        </div>
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
                    <td className="whitespace-nowrap font-medium">{inv.total}</td>
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
