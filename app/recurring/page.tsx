"use client";

import { useEffect, useState } from "react";
import { getClients, getCompanyProfile } from "@/app/actions";
import {
  createRecurringInvoice,
  deleteRecurringInvoice,
  generateInvoiceFromRecurring,
  getRecurringInvoices,
  toggleRecurringInvoice,
  updateRecurringInvoice,
} from "@/app/actions-recurring";
import DocumentLinesEditor, {
  type EditableLine,
} from "@/app/components/DocumentLinesEditor";
import Wrapper from "@/app/components/Wrapper";
import { formatMoney } from "@/lib/format";
import type {
  Client,
  CompanyProfile,
  RecurringFrequency,
  RecurringInvoice,
  RecurringInvoiceInput,
} from "@/type";
import {
  RECURRING_FREQUENCIES,
  RECURRING_FREQUENCY_LABELS,
} from "@/type";
import {
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  Edit,
  ExternalLink,
  FileInput,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  Repeat,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RecurringInvoicesPage() {
  const router = useRouter();
  const [list, setList] = useState<RecurringInvoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringInvoice | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const [form, setForm] = useState<RecurringInvoiceInput>({
    title: "",
    frequency: "MONTHLY",
    nextRunDate: new Date().toISOString().split("T")[0],
    endDate: null,
    active: true,
    clientId: "",
    issuerName: "",
    issuerAddress: "",
    clientName: "",
    clientAddress: "",
    clientEmail: "",
    notes: "",
    vatActive: false,
    vatRate: 18,
    currency: "XOF",
    lines: [
      {
        description: "Abonnement mensuel / Prestation",
        quantity: 1,
        unitPrice: 0,
      },
    ],
  });

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [items, clientList, comp] = await Promise.all([
        getRecurringInvoices(),
        getClients(),
        getCompanyProfile(),
      ]);
      setList(items);
      setClients(clientList);
      setCompany(comp);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setForm({
      title: "",
      frequency: "MONTHLY",
      nextRunDate: new Date().toISOString().split("T")[0],
      endDate: null,
      active: true,
      clientId: "",
      issuerName: company?.name || "",
      issuerAddress: company?.address || "",
      clientName: "",
      clientAddress: "",
      clientEmail: "",
      notes: "Facturation périodique automatique.",
      vatActive: false,
      vatRate: 18,
      currency: "XOF",
      lines: [
        {
          description: "Abonnement ou prestation récurrente",
          quantity: 1,
          unitPrice: 50000,
        },
      ],
    });
    setModalOpen(true);
  };

  const openEditModal = (item: RecurringInvoice) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      frequency: item.frequency,
      nextRunDate: new Date(item.nextRunDate).toISOString().split("T")[0],
      endDate: item.endDate
        ? new Date(item.endDate).toISOString().split("T")[0]
        : null,
      active: item.active,
      clientId: item.clientId || "",
      issuerName: item.issuerName || "",
      issuerAddress: item.issuerAddress || "",
      clientName: item.clientName || "",
      clientAddress: item.clientAddress || "",
      clientEmail: item.clientEmail || "",
      notes: item.notes || "",
      vatActive: item.vatActive,
      vatRate: item.vatRate,
      currency: item.currency,
      lines: item.lines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
      })),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert("Veuillez renseigner un titre pour cet abonnement.");
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        await updateRecurringInvoice(editingItem.id, form);
      } else {
        await createRecurringInvoice(form);
      }
      setModalOpen(false);
      await fetchAll();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement de l'abonnement.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await toggleRecurringInvoice(id, !current);
      await fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer le modèle récurrent "${title}" ?`)) return;
    try {
      await deleteRecurringInvoice(id);
      await fetchAll();
    } catch (err) {
      console.error(err);
      alert("Impossible de supprimer.");
    }
  };

  const handleGenerateNow = async (id: string) => {
    setGeneratingId(id);
    try {
      const invoice = await generateInvoiceFromRecurring(id);
      router.push(`/invoice/${invoice.id}`);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Erreur lors de la génération.");
    } finally {
      setGeneratingId(null);
    }
  };

  const handleSelectClient = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    setForm({
      ...form,
      clientId: client.id,
      clientName: client.name,
      clientAddress: client.address || "",
      clientEmail: client.email || form.clientEmail,
    });
  };

  return (
    <Wrapper>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
              <Repeat className="h-7 w-7 text-info" />
              Factures Récurrentes & Abonnements
            </h1>
            <p className="text-sm text-base-content/70">
              Automatisez l&apos;émission périodique de factures pour vos contrats, maintenances et forfaits.
            </p>
          </div>
          <button onClick={openCreateModal} className="btn btn-info btn-sm sm:btn-md gap-2">
            <Plus className="h-4 w-4" />
            Nouvel abonnement
          </button>
        </div>

        {/* Liste des abonnements */}
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-lg text-info" />
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-base-300 p-12 text-center bg-base-100">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-base-200">
              <Repeat className="h-7 w-7 text-info" />
            </div>
            <h3 className="text-lg font-bold">Aucun abonnement récurrent</h3>
            <p className="mt-1 text-sm text-base-content/60 max-w-md mx-auto">
              Créez un modèle pour facturer automatiquement vos clients chaque mois, trimestre ou année sans ressaisie.
            </p>
            <button
              onClick={openCreateModal}
              className="btn btn-info btn-sm mt-5 gap-2"
            >
              <Plus className="h-4 w-4" />
              Créer un abonnement récurrent
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {list.map((item) => {
              const totalLines = item.lines.reduce(
                (acc, l) => acc + l.quantity * l.unitPrice,
                0,
              );
              const vat = item.vatActive ? totalLines * (item.vatRate / 100) : 0;
              const totalTTC = totalLines + vat;

              return (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between rounded-2xl border bg-base-100 p-5 shadow-sm transition hover:shadow-md ${
                    item.active ? "border-base-300" : "border-base-200 opacity-70"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">{item.title}</h3>
                          <span
                            className={`badge badge-sm ${
                              item.active ? "badge-success" : "badge-ghost"
                            }`}
                          >
                            {item.active ? "Actif" : "En pause"}
                          </span>
                        </div>
                        <p className="text-xs text-base-content/60 mt-0.5">
                          Client : <strong>{item.clientName || "Sans client"}</strong>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="badge badge-info badge-outline text-xs">
                          {RECURRING_FREQUENCY_LABELS[item.frequency]}
                        </span>
                        <div className="font-extrabold text-info text-lg mt-1">
                          {formatMoney(totalTTC, item.currency)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-base-content/70 rounded-xl bg-base-200/50 p-3">
                      <div>
                        <span className="block opacity-60">Prochaine échéance :</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3.5 w-3.5 text-info" />
                          {new Date(item.nextRunDate).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="block opacity-60">Factures générées :</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                          <FileInput className="h-3.5 w-3.5 text-info" />
                          {item.generatedInvoices?.length || 0} facture(s)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 border-t border-base-200 pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggle(item.id, item.active)}
                        className={`btn btn-xs ${
                          item.active ? "btn-ghost text-warning" : "btn-ghost text-success"
                        }`}
                        title={item.active ? "Mettre en pause" : "Activer"}
                      >
                        {item.active ? (
                          <>
                            <PauseCircle className="h-3.5 w-3.5" /> Pause
                          </>
                        ) : (
                          <>
                            <PlayCircle className="h-3.5 w-3.5" /> Activer
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => openEditModal(item)}
                        className="btn btn-ghost btn-circle btn-xs"
                        title="Modifier le modèle"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        className="btn btn-ghost btn-circle btn-xs text-error"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleGenerateNow(item.id)}
                      disabled={generatingId === item.id}
                      className="btn btn-info btn-xs gap-1.5 shadow-sm"
                    >
                      {generatingId === item.id ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        <>
                          <Zap className="h-3.5 w-3.5" />
                          Émettre la facture
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Création / Édition */}
        {modalOpen && (
          <div className="modal modal-open">
            <div className="modal-box max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-base-300">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Repeat className="h-5 w-5 text-info" />
                  {editingItem ? "Modifier l'abonnement" : "Nouvel abonnement récurrent"}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="btn btn-sm btn-circle btn-ghost"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Titre de l&apos;abonnement *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Forfait Maintenance Site Web"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="input input-bordered w-full"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Périodicité / Fréquence *</span>
                    </label>
                    <select
                      value={form.frequency}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          frequency: e.target.value as RecurringFrequency,
                        })
                      }
                      className="select select-bordered w-full"
                    >
                      {RECURRING_FREQUENCIES.map((f) => (
                        <option key={f} value={f}>
                          {RECURRING_FREQUENCY_LABELS[f]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Client associé</span>
                    </label>
                    <select
                      value={form.clientId || ""}
                      onChange={(e) => handleSelectClient(e.target.value)}
                      className="select select-bordered w-full"
                    >
                      <option value="">Sélectionner un client…</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Prochaine date d&apos;émission *</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={
                        typeof form.nextRunDate === "string"
                          ? form.nextRunDate
                          : new Date().toISOString().split("T")[0]
                      }
                      onChange={(e) =>
                        setForm({ ...form, nextRunDate: e.target.value })
                      }
                      className="input input-bordered w-full"
                    />
                  </div>
                </div>

                {/* Coordonnées Client */}
                <div className="rounded-xl bg-base-200/50 p-3 space-y-3">
                  <span className="text-xs font-bold uppercase text-base-content/60">
                    Détails du client destinataire
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nom / Société"
                      value={form.clientName || ""}
                      onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                      className="input input-bordered input-sm w-full"
                    />
                    <input
                      type="email"
                      placeholder="Email pour envoi"
                      value={form.clientEmail || ""}
                      onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                      className="input input-bordered input-sm w-full"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Adresse de facturation"
                    value={form.clientAddress || ""}
                    onChange={(e) => setForm({ ...form, clientAddress: e.target.value })}
                    className="input input-bordered input-sm w-full"
                  />
                </div>

                {/* Édition des Lignes */}
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Prestations / Lignes de facturation</span>
                  </label>
                  <DocumentLinesEditor
                    title="Lignes récurrentes"
                    currency={form.currency}
                    lines={form.lines.map((l, i) => ({
                      id: `line-${i}`,
                      description: l.description,
                      quantity: l.quantity,
                      unitPrice: l.unitPrice,
                    }))}
                    onChange={(next) =>
                      setForm({
                        ...form,
                        lines: next.map((l) => ({
                          description: l.description,
                          quantity: l.quantity,
                          unitPrice: l.unitPrice,
                        })),
                      })
                    }
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Notes / Conditions récurrentes</span>
                  </label>
                  <textarea
                    rows={2}
                    value={form.notes || ""}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Ex: Facturation mensuelle sans engagement..."
                    className="textarea textarea-bordered w-full"
                  />
                </div>

                <div className="modal-action">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn btn-ghost"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !form.title.trim()}
                    className="btn btn-info"
                  >
                    {saving ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : editingItem ? (
                      "Mettre à jour"
                    ) : (
                      "Enregistrer l'abonnement"
                    )}
                  </button>
                </div>
              </form>
            </div>
            <div className="modal-backdrop" onClick={() => setModalOpen(false)} />
          </div>
        )}
      </div>
    </Wrapper>
  );
}
