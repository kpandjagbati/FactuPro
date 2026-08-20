"use client";

import Wrapper from "@/app/components/Wrapper";
import ExportExcelButton from "@/app/components/ExportExcelButton";
import { exportClientsExcel } from "@/app/actions-export";
import type { Client, ClientInput } from "@/type";
import { Pencil, Plus, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createClient,
  deleteClient,
  getClients,
  updateClient,
} from "@/app/actions";

const emptyForm: ClientInput = {
  name: "",
  email: "",
  phone: "",
  address: "",
  taxId: "",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ClientInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadClients = async () => {
    try {
      setClients(await getClients());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadClients();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    (document.getElementById("client_modal") as HTMLDialogElement)?.showModal();
  };

  const openEditModal = (client: Client) => {
    setEditingId(client.id);
    setForm({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      taxId: client.taxId || "",
    });
    (document.getElementById("client_modal") as HTMLDialogElement)?.showModal();
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateClient(editingId, form);
      } else {
        await createClient(form);
      }
      await loadClients();
      (document.getElementById("client_modal") as HTMLDialogElement)?.close();
      setForm(emptyForm);
      setEditingId(null);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'enregistrement du client.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (clientId: string) => {
    if (!window.confirm("Supprimer ce client ?")) return;
    try {
      await deleteClient(clientId);
      await loadClients();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression.");
    }
  };

  return (
    <Wrapper>
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-lg font-bold">Clients</h1>
          <div className="flex flex-wrap gap-2">
            {!loading && clients.length > 0 && (
              <ExportExcelButton exportFn={exportClientsExcel} />
            )}
            <button className="btn btn-info btn-sm w-full sm:w-auto" onClick={openCreateModal}>
            <Plus className="w-4" />
            Ajouter
          </button>
          </div>
        </div>

        {loading ? (
          <span className="loading loading-spinner loading-md text-info" />
        ) : clients.length === 0 ? (
          <p className="text-base-content/70">
            Aucun client pour le moment. Ajoutez votre premier client.
          </p>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="rounded-xl bg-base-200 p-4"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{client.name}</p>
                      <p className="truncate text-sm text-base-content/65">
                        {client.email || "—"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => openEditModal(client)}
                        aria-label="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm text-error"
                        onClick={() => handleDelete(client.id)}
                        aria-label="Supprimer"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-base-content/50">Tél.</span>
                      <p>{client.phone || "—"}</p>
                    </div>
                    <div>
                      <span className="text-base-content/50">IFU / NIF</span>
                      <p className="truncate">{client.taxId || "—"}</p>
                    </div>
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
                    <th>Téléphone</th>
                    <th>IFU / NIF</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id}>
                      <td className="font-medium">{client.name}</td>
                      <td>{client.email || "—"}</td>
                      <td>{client.phone || "—"}</td>
                      <td>{client.taxId || "—"}</td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => openEditModal(client)}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm text-error"
                            onClick={() => handleDelete(client.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <dialog id="client_modal" className="modal">
          <div className="modal-box w-11/12 max-w-lg">
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                ✕
              </button>
            </form>
            <h3 className="mb-4 text-lg font-bold">
              {editingId ? "Modifier le client" : "Nouveau client"}
            </h3>
            <div className="space-y-3">
              <input
                className="input input-bordered w-full"
                placeholder="Nom *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                className="input input-bordered w-full"
                placeholder="Email"
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                className="input input-bordered w-full"
                placeholder="Téléphone"
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Adresse"
                value={form.address || ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <input
                className="input input-bordered w-full"
                placeholder="IFU / NIF / RCCM"
                value={form.taxId || ""}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
              />
              <button
                className="btn btn-info w-full"
                disabled={!form.name.trim() || saving}
                onClick={handleSave}
              >
                {saving ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  "Enregistrer"
                )}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>
      </div>
    </Wrapper>
  );
}
