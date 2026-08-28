"use client";

import { useEffect, useState } from "react";
import { getClients, getCompanyProfile, getInvoices } from "@/app/actions";
import {
  createCreditNote,
  createCreditNoteFromInvoice,
  deleteCreditNote,
  getCreditNotes,
} from "@/app/actions-credit-notes";
import Wrapper from "@/app/components/Wrapper";
import { formatMoney } from "@/lib/format";
import type { Client, CompanyProfile, CreditNote, Invoice } from "@/type";
import {
  ArrowDownLeft,
  FileBadge,
  FileMinus,
  FileText,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreditNotesPage() {
  const router = useRouter();
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [reason, setReason] = useState("Annulation / Rectification de facture");
  const [creating, setCreating] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [cnList, invList] = await Promise.all([
        getCreditNotes(),
        getInvoices(),
      ]);
      setCreditNotes(cnList);
      setInvoices(invList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreateFromInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      alert("Veuillez sélectionner une facture d'origine.");
      return;
    }

    setCreating(true);
    try {
      const created = await createCreditNoteFromInvoice(
        selectedInvoiceId,
        reason,
      );
      setModalOpen(false);
      router.push(`/credit-note/${created.id}`);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de l'avoir.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, number: string) => {
    if (!confirm(`Supprimer l'avoir ${number} ?`)) return;
    try {
      await deleteCreditNote(id);
      await fetchAll();
    } catch (err) {
      console.error(err);
      alert("Impossible de supprimer.");
    }
  };

  const filtered = creditNotes.filter((cn) => {
    return (
      cn.number.toLowerCase().includes(search.toLowerCase()) ||
      cn.clientName.toLowerCase().includes(search.toLowerCase()) ||
      cn.reason.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalAvoirs = creditNotes.reduce((acc, cn) => {
    const ht = cn.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const vat = cn.vatActive ? ht * (cn.vatRate / 100) : 0;
    return acc + ht + vat;
  }, 0);

  return (
    <Wrapper>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
              <FileMinus className="h-7 w-7 text-error" />
              Avoirs & Notes de Crédit
            </h1>
            <p className="text-sm text-base-content/70">
              Émettez des avoirs pour régulariser, annuler ou rembourser des factures en toute conformité.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="btn btn-error text-white btn-sm sm:btn-md gap-2"
          >
            <Plus className="h-4 w-4" />
            Créer un avoir
          </button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
            <div className="flex items-center justify-between text-base-content/60">
              <span className="text-xs font-semibold uppercase">Total Avoirs Émis</span>
              <ArrowDownLeft className="h-5 w-5 text-error" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-error">
              - {formatMoney(totalAvoirs, "XOF")}
            </div>
            <p className="mt-1 text-xs text-base-content/50">
              {creditNotes.length} avoir(s) enregistré(s)
            </p>
          </div>
        </div>

        {/* Recherche */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/50" />
          <input
            type="text"
            placeholder="Rechercher par n° d'avoir, client, motif..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered input-sm sm:input-md w-full pl-9"
          />
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-lg text-info" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-base-300 p-12 text-center bg-base-100">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-base-200">
              <FileMinus className="h-7 w-7 text-base-content/50" />
            </div>
            <h3 className="text-lg font-bold">Aucun avoir émis</h3>
            <p className="mt-1 text-sm text-base-content/60 max-w-md mx-auto">
              Les avoirs permettent d&apos;annuler légalement une facture ou d&apos;accorder une remise sans modifier l&apos;historique comptable.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="btn btn-error text-white btn-sm mt-5"
            >
              <Plus className="h-4 w-4" />
              Émettre un avoir
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-base-300 bg-base-100 shadow-sm">
            <table className="table w-full">
              <thead className="bg-base-200/50 text-xs uppercase text-base-content/70">
                <tr>
                  <th>N° Avoir</th>
                  <th>Date</th>
                  <th>Facture liée</th>
                  <th>Client</th>
                  <th>Motif</th>
                  <th className="text-right">Montant TTC</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200 text-sm">
                {filtered.map((cn) => {
                  const ht = cn.lines.reduce(
                    (s, l) => s + l.quantity * l.unitPrice,
                    0,
                  );
                  const vat = cn.vatActive ? ht * (cn.vatRate / 100) : 0;
                  const ttc = ht + vat;

                  return (
                    <tr key={cn.id} className="hover:bg-base-200/30">
                      <td className="font-bold">
                        <Link
                          href={`/credit-note/${cn.id}`}
                          className="badge badge-neutral text-xs font-mono"
                        >
                          {cn.number}
                        </Link>
                      </td>
                      <td className="text-xs text-base-content/70">
                        {new Date(cn.creditDate).toLocaleDateString("fr-FR")}
                      </td>
                      <td>
                        {cn.invoice ? (
                          <Link
                            href={`/invoice/${cn.invoice.id}`}
                            className="text-xs text-info hover:underline flex items-center gap-1"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            {cn.invoice.number}
                          </Link>
                        ) : (
                          <span className="text-xs text-base-content/40">—</span>
                        )}
                      </td>
                      <td className="font-semibold text-slate-800">
                        {cn.clientName || "—"}
                      </td>
                      <td className="text-xs text-base-content/70 max-w-xs truncate">
                        {cn.reason}
                      </td>
                      <td className="text-right font-bold text-error whitespace-nowrap">
                        - {formatMoney(ttc, cn.currency)}
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/credit-note/${cn.id}`}
                            className="btn btn-ghost btn-xs text-info"
                          >
                            Voir / PDF
                          </Link>
                          <button
                            onClick={() => handleDelete(cn.id, cn.number)}
                            className="btn btn-ghost btn-xs btn-circle text-error"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Création d'Avoir */}
        {modalOpen && (
          <div className="modal modal-open">
            <div className="modal-box max-w-lg">
              <div className="flex items-center justify-between pb-3 border-b border-base-300">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <FileMinus className="h-5 w-5 text-error" />
                  Créer un avoir depuis une facture
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="btn btn-sm btn-circle btn-ghost"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateFromInvoice} className="mt-4 space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Facture d&apos;origine à régulariser *</span>
                  </label>
                  <select
                    required
                    value={selectedInvoiceId}
                    onChange={(e) => setSelectedInvoiceId(e.target.value)}
                    className="select select-bordered w-full"
                  >
                    <option value="">Sélectionner une facture…</option>
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.number} - {inv.clientName || "Sans client"} ({inv.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Motif de l&apos;avoir *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Annulation de commande, Erreur de facturation, Geste commercial"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="input input-bordered w-full"
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
                    disabled={creating || !selectedInvoiceId}
                    className="btn btn-error text-white"
                  >
                    {creating ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      "Générer l'avoir"
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
