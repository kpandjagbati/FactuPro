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

  const invoices = data?.recentInvoices || [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Toutes les factures</h1>

      {invoices.length === 0 ? (
        <p className="text-sm opacity-60">Aucune facture.</p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {invoices.map((inv) => (
              <div key={inv.id} className="rounded-xl bg-base-200 p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-xs opacity-60">{inv.number}</p>
                    <p className="truncate font-semibold">{inv.name}</p>
                  </div>
                  <span className="badge badge-ghost badge-sm shrink-0">
                    {inv.status}
                  </span>
                </div>
                <p className="text-sm">{inv.organization}</p>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="font-bold">{inv.total}</span>
                  <span className="opacity-60">
                    {new Date(inv.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl bg-base-200 md:block">
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
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="font-mono text-xs">{inv.number}</td>
                    <td>{inv.name}</td>
                    <td>{inv.organization}</td>
                    <td>
                      <span className="badge badge-ghost badge-sm">
                        {inv.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">{inv.total}</td>
                    <td>{new Date(inv.createdAt).toLocaleDateString("fr-FR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
