"use client";

import InvoiceInfo from "@/app/components/InvoiceInfo";
import InvoiceLines from "@/app/components/InvoiceLines";
import VATControl from "@/app/components/VATControl";
import Wrapper from "@/app/components/Wrapper";
import { formatMoney } from "@/lib/format";
import type { Client, CompanyProfile, Invoice, InvoiceStatus, Totals } from "@/type";
import { INVOICE_STATUS_LABELS, INVOICE_STATUSES } from "@/type";
import { Mail, Save, Trash } from "lucide-react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  deleteInvoice,
  getClients,
  getCompanyProfile,
  getInvoiceById,
  updateInvoice,
} from "@/app/actions";
import { emailInvoice } from "@/app/actions-v2";
import { handleEmailResult } from "@/lib/email-client";

const InvoicePDF = dynamic(() => import("@/app/components/InvoicePDF"), {
  ssr: false,
  loading: () => (
    <div className="mt-4 rounded-xl border-2 border-dashed border-base-300 p-5 text-sm opacity-60">
      Chargement de l&apos;aperçu PDF…
    </div>
  ),
});

export default function InvoiceDetailPage() {
  const params = useParams<{ invoiceId: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [initialInvoice, setInitialInvoice] = useState<Invoice | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const fetchInvoice = async () => {
    try {
      const [fetchedInvoice, fetchedClients, fetchedCompany] = await Promise.all([
        getInvoiceById(params.invoiceId),
        getClients(),
        getCompanyProfile(),
      ]);
      setInvoice(fetchedInvoice);
      setInitialInvoice(fetchedInvoice);
      setClients(fetchedClients);
      setCompany(fetchedCompany);
    } catch (error) {
      console.error(error);
      setNotFound(true);
    }
  };

  useEffect(() => {
    if (params.invoiceId) {
      void fetchInvoice();
    }
  }, [params.invoiceId]);

  useEffect(() => {
    if (!invoice) return;
    const ht = invoice.lines.reduce(
      (acc, { quantity, unitPrice }) => acc + quantity * unitPrice,
      0,
    );
    const vat = invoice.vatActive ? ht * (invoice.vatRate / 100) : 0;
    setTotals({ totalHT: ht, totalVAT: vat, totalTTC: ht + vat });
  }, [invoice]);

  useEffect(() => {
    setIsSaveDisabled(
      JSON.stringify(invoice) === JSON.stringify(initialInvoice),
    );
  }, [invoice, initialInvoice]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!invoice) return;
    setInvoice({
      ...invoice,
      status: e.target.value as InvoiceStatus,
    });
  };

  const handleSave = async () => {
    if (!invoice) return;
    setIsLoading(true);
    try {
      const updatedInvoice = await updateInvoice(invoice);
      setInvoice(updatedInvoice);
      setInitialInvoice(updatedInvoice);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde :", error);
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;
    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir supprimer cette facture ?",
    );
    if (!confirmed) return;

    try {
      await deleteInvoice(invoice.id);
      router.push("/invoices");
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
      alert("Erreur lors de la suppression.");
    }
  };

  const handleEmail = async () => {
    if (!invoice) return;
    if (!isSaveDisabled) {
      alert("Sauvegardez la facture avant l'envoi.");
      return;
    }
    if (!invoice.clientEmail?.trim() && !invoice.client?.email) {
      alert("Ajoutez l'email du client avant l'envoi.");
      return;
    }
    setEmailing(true);
    try {
      const result = await emailInvoice(invoice.id);
      const mode = handleEmailResult(result, "facture");
      if (mode === "resend") {
        const refreshed = await getInvoiceById(invoice.id);
        setInvoice(refreshed);
        setInitialInvoice(refreshed);
      }
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'envoi de l'email.",
      );
    } finally {
      setEmailing(false);
    }
  };

  const handleSelectClient = (clientId: string) => {
    if (!invoice) return;
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    setInvoice({
      ...invoice,
      clientId: client.id,
      clientName: client.name,
      clientAddress: client.address || "",
      clientEmail: client.email || invoice.clientEmail,
    });
  };

  if (notFound) {
    return (
      <Wrapper>
        <div className="flex h-64 items-center justify-center">
          <span className="font-bold">Facture non trouvée</span>
        </div>
      </Wrapper>
    );
  }

  if (!invoice || !totals) {
    return (
      <Wrapper>
        <div className="flex h-64 items-center justify-center">
          <span className="loading loading-spinner loading-lg text-info" />
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div>
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
          <p className="badge badge-ghost badge-lg uppercase">
            {invoice.number}
            <span className="ml-2 opacity-60">· {invoice.name}</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-2 md:mt-0">
            <select
              className="select select-sm select-bordered"
              value={invoice.status}
              onChange={handleStatusChange}
            >
              {INVOICE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {INVOICE_STATUS_LABELS[status]}
                </option>
              ))}
            </select>

            <button
              className="btn btn-sm btn-info"
              disabled={isSaveDisabled || isLoading}
              onClick={handleSave}
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  Sauvegarder
                  <Save className="ml-2 w-4" />
                </>
              )}
            </button>

            <button
              className="btn btn-sm btn-secondary"
              disabled={emailing}
              onClick={handleEmail}
            >
              {emailing ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  Email
                  <Mail className="ml-2 w-4" />
                </>
              )}
            </button>

            <button onClick={handleDelete} className="btn btn-sm btn-error">
              <Trash className="w-4" />
            </button>
          </div>
        </div>

        <div className="flex w-full flex-col md:flex-row">
          <div className="flex w-full flex-col md:w-1/3">
            <div className="mb-4 rounded-xl bg-base-200 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="badge badge-info">Résumé des totaux</div>
                <VATControl document={invoice} setDocument={setInvoice} />
              </div>

              <div className="flex justify-between">
                <span>Total Hors Taxes</span>
                <span>{formatMoney(totals.totalHT, invoice.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>
                  TVA ({invoice.vatActive ? `${invoice.vatRate}` : "0"} %)
                </span>
                <span>{formatMoney(totals.totalVAT, invoice.currency)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total TTC</span>
                <span>{formatMoney(totals.totalTTC, invoice.currency)}</span>
              </div>
            </div>

            <InvoiceInfo
              invoice={invoice}
              setInvoice={setInvoice}
              clients={clients}
              onSelectClient={handleSelectClient}
            />
          </div>

          <div className="mt-4 flex w-full flex-col md:ml-4 md:mt-0 md:w-2/3">
            <InvoiceLines invoice={invoice} setInvoice={setInvoice} />
            <InvoicePDF invoice={invoice} totals={totals} company={company} />
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
