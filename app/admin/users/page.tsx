"use client";

import { getAdminOverview } from "@/app/actions-admin";
import { formatDisplayDateTime } from "@/lib/format";
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

  const users = data?.users || [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Utilisateurs</h1>
      <p className="text-sm text-base-content/70">
        Comptes clients FactuPro (hors compte admin plateforme).
      </p>

      {users.length === 0 ? (
        <p className="text-sm opacity-60">Aucun utilisateur pour le moment.</p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {users.map((u) => (
              <div key={u.id} className="rounded-xl bg-base-200 p-4">
                <p className="font-semibold">{u.name}</p>
                <p className="truncate text-sm text-base-content/65">{u.email}</p>
                <div className="mt-2 flex justify-between text-sm">
                  <span>{u.organization}</span>
                  <span className="shrink-0 font-medium text-info">
                    {u.joinedAtLabel ?? formatDisplayDateTime(u.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl bg-base-200 md:block">
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Organisation</th>
                  <th>Accès depuis</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="font-medium">{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.organization}</td>
                    <td className="whitespace-nowrap font-medium text-info">
                      {u.joinedAtLabel ?? formatDisplayDateTime(u.createdAt)}
                    </td>
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
