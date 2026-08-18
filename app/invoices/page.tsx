"use client";

import Wrapper from "@/app/components/Wrapper";
import InvoiceComponent from "@/app/components/InvoiceComponent";
import { createEmptyInvoice, getInvoices } from "@/app/actions";
import type { Invoice, InvoiceStatus } from "@/type";
import { INVOICE_STATUS_LABELS, INVOICE_STATUSES } from "@/type";
import { Plus } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";

export default function InvoicesPage() {
  const { user } = useUser();
  const [invoiceName, setInvoiceName] = useState("");
  const [isNameValid, setIsNameValid] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "ALL">("ALL");

  const fetchInvoices = async () => {
    try {
      const data = await getInvoices();
      setInvoices(data);
    } catch (error) {
      console.error("Erreur lors du chargement des factures", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchInvoices();
  }, []);

  useEffect(() => {
    setIsNameValid(invoiceName.length <= 60);
  }, [invoiceName]);

  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const matchStatus =
        statusFilter === "ALL" || invoice.status === statusFilter;
      const matchSearch =
        !q ||
        invoice.name.toLowerCase().includes(q) ||
        invoice.number.toLowerCase().includes(q) ||
        invoice.clientName.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [invoices, search, statusFilter]);

  const handleCreateInvoice = async () => {
    if (!isNameValid || invoiceName.trim().length === 0) return;
    setCreating(true);
    try {
      await createEmptyInvoice(invoiceName);
      await fetchInvoices();
      setInvoiceName("");
      const modal = document.getElementById(
        "create_invoice_modal",
      ) as HTMLDialogElement | null;
      modal?.close();
      const { default: confetti } = await import("canvas-confetti");
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 9999,
      });
    } catch (error) {
      console.error("Erreur lors de la création de la facture :", error);
      alert("Impossible de créer la facture.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Wrapper>
      <div className="flex flex-col space-y-4">
        <h1 className="text-lg font-bold">Mes factures</h1>

        {loading ? (
          <span className="loading loading-spinner loading-md text-info" />
        ) : (
          <p className="text-base-content/70">
            Bienvenue{user?.firstName ? `, ${user.firstName}` : ""} —{" "}
            {filteredInvoices.length}/{invoices.length} facture
            {invoices.length !== 1 ? "s" : ""}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="input input-bordered w-full sm:max-w-xs"
            placeholder="Rechercher (n°, nom, client)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select select-bordered w-full sm:max-w-xs"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as InvoiceStatus | "ALL")
            }
          >
            <option value="ALL">Tous les statuts</option>
            {INVOICE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {INVOICE_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-info p-5 transition hover:bg-base-200"
            onClick={() =>
              (
                document.getElementById(
                  "create_invoice_modal",
                ) as HTMLDialogElement
              )?.showModal()
            }
          >
            <div className="font-bold text-info">Créer une facture</div>
            <div className="mt-2 rounded-full bg-info p-2 text-info-content">
              <Plus className="h-6 w-6" />
            </div>
          </div>

          {filteredInvoices.map((invoice) => (
            <InvoiceComponent key={invoice.id} invoice={invoice} />
          ))}
        </div>

        <dialog id="create_invoice_modal" className="modal">
          <div className="modal-box">
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                ✕
              </button>
            </form>

            <h3 className="text-lg font-bold">Nouvelle facture</h3>

            <input
              type="text"
              placeholder="Nom de la facture (max 60 caractères)"
              className="input input-bordered my-4 w-full"
              value={invoiceName}
              onChange={(e) => setInvoiceName(e.target.value)}
            />

            {!isNameValid && (
              <p className="mb-4 text-sm text-error">
                Le nom ne peut pas dépasser 60 caractères.
              </p>
            )}

            <button
              className="btn btn-info"
              disabled={
                !isNameValid || invoiceName.trim().length === 0 || creating
              }
              onClick={handleCreateInvoice}
            >
              {creating ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Créer"
              )}
            </button>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>
      </div>
    </Wrapper>
  );
}
