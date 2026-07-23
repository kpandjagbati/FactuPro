"use client";

import { getAdminOverview } from "@/app/actions-admin";
import { useEffect, useState } from "react";

type Overview = Awaited<ReturnType<typeof getAdminOverview>>;

export default function AdminUsersPage() {
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
      <h1 className="text-xl font-bold">Utilisateurs</h1>
      <p className="text-sm text-base-content/70">
        Comptes clients FactuPro (hors compte admin plateforme).
      </p>
      <div className="overflow-x-auto rounded-xl bg-base-200">
        <table className="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Organisation</th>
              <th>Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            {(data?.users || []).map((u) => (
              <tr key={u.id}>
                <td className="font-medium">{u.name}</td>
                <td>{u.email}</td>
                <td>{u.organization}</td>
                <td>{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.users.length === 0 && (
          <p className="p-4 text-sm opacity-60">Aucun utilisateur pour le moment.</p>
        )}
      </div>
    </div>
  );
}
