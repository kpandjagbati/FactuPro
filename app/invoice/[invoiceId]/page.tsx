"use client";

import InvoiceInfo from "@/app/components/InvoiceInfo";
import InvoiceLines from "@/app/components/InvoiceLines";
import PaymentTracker from "@/app/components/PaymentTracker";
import VATControl from "@/app/components/VATControl";
import Wrapper from "@/app/components/Wrapper";
import { formatMoney } from "@/lib/format";
import type { Client, CompanyProfile, Invoice, InvoiceStatus, Totals } from "@/type";
import { INVOICE_STATUS_LABELS, INVOICE_STATUSES } from "@/type";
import { BellRing, Copy, FileMinus, Mail, Save, Trash, Truck } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  deleteInvoice,
  duplicateInvoice,
  getClients,
  getCompanyProfile,
  getInvoiceById,
  updateInvoice,
} from "@/app/actions";
import { createCreditNoteFromInvoice } from "@/app/actions-credit-notes";
import { emailInvoice, sendPaymentReminder } from "@/app/actions-v2";
import WhatsAppButton from "@/app/components/WhatsAppButton";
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
  const [reminding, setReminding] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [crediting, setCrediting] = useState(false);
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

  const handleReminder = async () => {
    if (!invoice) return;
    if (!isSaveDisabled) {
      alert("Sauvegardez la facture avant d'envoyer une relance.");
      return;
    }
    if (invoice.status !== "SENT" && invoice.status !== "OVERDUE") {
      alert("Les relances concernent les factures en attente ou impayées.");
      return;
    }
    setReminding(true);
    try {
      const result = await sendPaymentReminder(invoice.id);
      handleEmailResult(result, "relance");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'envoi de la relance.");
    } finally {
      setReminding(false);
    }
  };

  const handleDuplicate = async () => {
    if (!invoice) return;
    setDuplicating(true);
    try {
      const copy = await duplicateInvoice(invoice.id);
      router.push(`/invoice/${copy.id}`);
    } catch (error) {
      console.error(error);
      alert("Impossible de dupliquer la facture.");
    } finally {
      setDuplicating(false);
    }
  };

  const handleCreateCreditNote = async () => {
    if (!invoice) return;
    const reason = window.prompt(
      "Motif de l'avoir / rectification :",
      "Annulation ou remise sur facture",
    );
    if (!reason) return;

    setCrediting(true);
    try {
      const creditNote = await createCreditNoteFromInvoice(invoice.id, reason);
      router.push(`/credit-note/${creditNote.id}`);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la création de l'avoir.");
    } finally {
      setCrediting(false);
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
          <p className="badge badge-ghost badge-lg max-w-full whitespace-normal uppercase">
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

            <WhatsAppButton
              type={
                invoice.status === "SENT" || invoice.status === "OVERDUE"
                  ? "reminder"
                  : "invoice"
              }
              docNumber={invoice.number}
              clientName={invoice.clientName}
              clientPhone={
                clients.find((c) => c.id === invoice.clientId)?.phone || null
              }
              totalFormatted={formatMoney(totals.totalTTC, invoice.currency)}
              issuerName={invoice.issuerName || company?.name}
              portalUrl={
                typeof window !== "undefined" && invoice.publicToken
                  ? `${window.location.origin}/view/invoice/${invoice.publicToken}`
                  : ""
              }
              dueDateFormatted={
                invoice.dueDate
                  ? new Date(invoice.dueDate).toLocaleDateString("fr-FR")
                  : undefined
              }
              remainingFormatted={
                totals.remainingDue !== undefined
                  ? formatMoney(totals.remainingDue, invoice.currency)
                  : undefined
              }
            />

            {(invoice.status === "SENT" || invoice.status === "OVERDUE") && (
              <button
                className="btn btn-sm btn-warning"
                disabled={reminding}
                onClick={handleReminder}
              >
                {reminding ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
                    Relance
                    <BellRing className="ml-2 w-4" />
                  </>
                )}
              </button>
            )}

            <Link
              href={`/delivery/${invoice.id}`}
              className="btn btn-sm btn-outline gap-1"
              title="Générer ou imprimer le Bon de Livraison"
            >
              BL <Truck className="h-4 w-4" />
            </Link>

            <button
              className="btn btn-sm btn-ghost"
              disabled={duplicating}
              onClick={handleDuplicate}
            >
              {duplicating ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  Dupliquer
                  <Copy className="ml-2 w-4" />
                </>
              )}
            </button>

            <button
              className="btn btn-sm btn-ghost text-error"
              disabled={crediting}
              onClick={handleCreateCreditNote}
              title="Créer un avoir pour cette facture"
            >
              {crediting ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  Avoir
                  <FileMinus className="ml-2 w-4" />
                </>
              )}
            </button>

            <button onClick={handleDelete} className="btn btn-sm btn-error">
              <Trash className="w-4" />
            </button>
          </div>
        </div>

        <div className="flex w-full flex-col md:flex-row">
          <div className="flex w-full flex-col space-y-4 md:w-1/3">
            <div className="rounded-xl bg-base-200 p-5">
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

            <PaymentTracker
              invoiceId={invoice.id}
              currency={invoice.currency}
              totalTTC={totals.totalTTC}
              publicToken={invoice.publicToken}
              viewedAt={invoice.viewedAt}
              invoiceNumber={invoice.number}
              clientName={invoice.clientName}
              clientPhone={
                clients.find((c) => c.id === invoice.clientId)?.phone || null
              }
              issuerName={invoice.issuerName || company?.name}
              onPaymentUpdated={fetchInvoice}
            />

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
