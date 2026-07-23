"use client";

import { getAdminOverview } from "@/app/actions-admin";
import { useEffect, useState } from "react";

type Overview = Awaited<ReturnType<typeof getAdminOverview>>;

export default function AdminInvoicesPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getAdminOverview()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <span className="loading loading-spinner loading-md text-info" />;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Toutes les factures</h1>
      <div className="overflow-x-auto rounded-xl bg-base-200">
        <table className="table">
          <thead>
            <tr>
              <th>N°</th>
              <th>Nom</th>
              <th>Organisation</th>
              <th>Statut</th>
              <th>Total</th>
              <th>Créée le</th>
            </tr>
          </thead>
          <tbody>
            {(data?.recentInvoices || []).map((inv) => (
              <tr key={inv.id}>
                <td className="font-mono text-xs">{inv.number}</td>
                <td>{inv.name}</td>
                <td>{inv.organization}</td>
                <td>
                  <span className="badge badge-ghost badge-sm">{inv.status}</span>
                </td>
                <td className="whitespace-nowrap">{inv.total}</td>
                <td>{new Date(inv.createdAt).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
