"use client";

import { useEffect, useState } from "react";
import {
  addPayment,
  deletePayment,
  getInvoicePayments,
} from "@/app/actions-payments";
import { ensureInvoicePublicToken } from "@/app/actions-portal";
import PaymentMethodLogo, {
  MixxByYasLogo,
  MoovMoneyLogo,
} from "@/app/components/PaymentMethodLogo";
import { formatMoney } from "@/lib/format";
import type { Payment, PaymentInput } from "@/type";
import { PAYMENT_METHODS } from "@/type";
import {
  CheckCircle2,
  Copy,
  CreditCard,
  Eye,
  ExternalLink,
  MessageCircle,
  Plus,
  Receipt,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  buildReceiptWhatsAppMessage,
  generateWhatsAppLink,
} from "@/lib/whatsapp";

interface Props {
  invoiceId: string;
  currency: string;
  totalTTC: number;
  publicToken?: string | null;
  viewedAt?: Date | string | null;
  invoiceNumber?: string;
  clientName?: string;
  clientPhone?: string | null;
  issuerName?: string;
  onPaymentUpdated?: () => void;
}

export default function PaymentTracker({
  invoiceId,
  currency,
  totalTTC,
  publicToken: initialToken,
  viewedAt,
  invoiceNumber,
  clientName,
  clientPhone,
  issuerName,
  onPaymentUpdated,
}: Props) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState(initialToken || "");
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState<PaymentInput>({
    amount: 0,
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Virement bancaire",
    reference: "",
    notes: "",
  });

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await getInvoicePayments(invoiceId);
      setPayments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (invoiceId) {
      loadPayments();
    }
  }, [invoiceId]);

  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  const remainingDue = Math.max(0, totalTTC - totalPaid);
  const percentPaid =
    totalTTC > 0 ? Math.min(100, Math.round((totalPaid / totalTTC) * 100)) : 0;

  const openAddModal = () => {
    setForm({
      amount: remainingDue > 0 ? remainingDue : totalTTC,
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "Virement bancaire",
      reference: "",
      notes: "",
    });
    setModalOpen(true);
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.amount <= 0) {
      alert("Le montant doit être supérieur à 0.");
      return;
    }

    setSaving(true);
    try {
      await addPayment(invoiceId, form);
      setModalOpen(false);
      await loadPayments();
      if (onPaymentUpdated) onPaymentUpdated();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement du paiement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (paymentId: string) => {
    if (!confirm("Supprimer ce règlement ?")) return;
    try {
      await deletePayment(paymentId, invoiceId);
      await loadPayments();
      if (onPaymentUpdated) onPaymentUpdated();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression.");
    }
  };

  const handleCopyPublicLink = async () => {
    try {
      let activeToken = token;
      if (!activeToken) {
        activeToken = await ensureInvoicePublicToken(invoiceId);
        setToken(activeToken);
      }

      const url = `${window.location.origin}/view/invoice/${activeToken}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error(err);
      alert("Impossible de générer le lien de partage.");
    }
  };

  return (
    <div className="space-y-4 rounded-xl bg-base-200 p-4 sm:p-5">
      {/* En-tête suivi */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="badge badge-info">Règlements & Partage Client</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyPublicLink}
            className="btn btn-outline btn-xs sm:btn-sm gap-1"
            title="Copier le lien public pour le client"
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                <span className="text-success">Lien copié !</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Lien client</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="btn btn-info btn-xs sm:btn-sm gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Paiement</span>
          </button>
        </div>
      </div>

      {/* Indicateur de consultation client */}
      {viewedAt && (
        <div className="flex items-center gap-1.5 text-xs text-info bg-info/10 rounded-lg p-2">
          <Eye className="h-3.5 w-3.5 shrink-0" />
          <span>
            Vu par le client le{" "}
            {new Date(viewedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      )}

      {/* Résumé des paiements */}
      <div className="rounded-xl border border-base-300 bg-base-100 p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-xs text-base-content/60">Payé</span>
            <div className="font-bold text-success">
              {formatMoney(totalPaid, currency)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-base-content/60">Reste dû</span>
            <div
              className={`font-bold ${
                remainingDue === 0 ? "text-success" : "text-error"
              }`}
            >
              {formatMoney(remainingDue, currency)}
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="w-full bg-base-300 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              remainingDue === 0 ? "bg-success" : "bg-info"
            }`}
            style={{ width: `${percentPaid}%` }}
          />
        </div>
        <div className="text-right text-[11px] text-base-content/50">
          {percentPaid}% réglé
        </div>
      </div>

      {/* Liste des paiements enregistrés */}
      {payments.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase text-base-content/60">
            Historique ({payments.length})
          </span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <PaymentMethodLogo method={p.paymentMethod} size="sm" />
                  <div>
                    <div className="font-semibold text-base-content">
                      {formatMoney(p.amount, currency)}
                    </div>
                    <div className="text-[11px] text-base-content/60">
                      {new Date(p.paymentDate).toLocaleDateString("fr-FR")} •{" "}
                      {p.paymentMethod}
                      {p.reference ? ` (${p.reference})` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/receipt/${p.id}`}
                    className="btn btn-ghost btn-xs btn-circle text-info"
                    title="Générer / Télécharger le Reçu PDF"
                  >
                    <Receipt className="h-3.5 w-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      const msg = buildReceiptWhatsAppMessage({
                        clientName: clientName || "",
                        receiptNumber: p.receiptNumber || `REC-${p.id.slice(-6)}`,
                        invoiceNumber: invoiceNumber || "",
                        amountFormatted: formatMoney(p.amount, currency),
                        paymentMethod: p.paymentMethod,
                        issuerName: issuerName || "FactuPro",
                        remainingFormatted:
                          remainingDue > 0
                            ? formatMoney(remainingDue, currency)
                            : undefined,
                      });
                      const link = generateWhatsAppLink(clientPhone || "", msg);
                      window.open(link, "_blank", "noopener,noreferrer");
                    }}
                    className="btn btn-ghost btn-xs btn-circle text-success"
                    title="Envoyer la quittance / reçu par WhatsApp"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="btn btn-ghost btn-xs btn-circle text-error"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raccourcis Togo Mobile Money */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-base-300/60 text-xs text-base-content/70">
        <span className="text-[11px] font-medium">Mobile Money Togo :</span>
        <div className="flex items-center gap-3">
          <MixxByYasLogo size="sm" showText={true} />
          <MoovMoneyLogo size="sm" showText={true} />
        </div>
      </div>

      {/* Modal Ajout Règlement */}
      {modalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <div className="flex items-center justify-between pb-3 border-b border-base-300">
              <h3 className="font-bold text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-info" />
                Enregistrer un règlement / acompte
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddPayment} className="mt-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Montant reçu ({currency}) *
                  </span>
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={form.amount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      amount:
                        e.target.value === ""
                          ? 0
                          : parseFloat(e.target.value),
                    })
                  }
                  className="input input-bordered w-full"
                />
              </div>

              {/* Sélection rapide Mobile Money Togo */}
              <div className="space-y-1.5">
                <label className="label py-0">
                  <span className="label-text font-semibold text-xs">
                    Paiement direct Mobile Money Togo :
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        paymentMethod: "Mixx by Yas (Togocom)",
                      })
                    }
                    className={`btn h-auto py-2.5 px-3 flex items-center justify-start border transition-all ${
                      form.paymentMethod === "Mixx by Yas (Togocom)"
                        ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                        : "border-base-300 bg-base-100 hover:bg-base-200"
                    }`}
                  >
                    <MixxByYasLogo size="sm" showText={true} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        paymentMethod: "Moov Money (Moov Africa)",
                      })
                    }
                    className={`btn h-auto py-2.5 px-3 flex items-center justify-start border transition-all ${
                      form.paymentMethod === "Moov Money (Moov Africa)"
                        ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                        : "border-base-300 bg-base-100 hover:bg-base-200"
                    }`}
                  >
                    <MoovMoneyLogo size="sm" showText={true} />
                  </button>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Mode de règlement
                  </span>
                </label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) =>
                    setForm({ ...form, paymentMethod: e.target.value })
                  }
                  className="select select-bordered w-full"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Date de paiement
                  </span>
                </label>
                <input
                  type="date"
                  required
                  value={
                    typeof form.paymentDate === "string"
                      ? form.paymentDate
                      : new Date().toISOString().split("T")[0]
                  }
                  onChange={(e) =>
                    setForm({ ...form, paymentDate: e.target.value })
                  }
                  className="input input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Référence / Numéro de transaction (optionnel)
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ref Wave #829103, Virement #540"
                  value={form.reference || ""}
                  onChange={(e) =>
                    setForm({ ...form, reference: e.target.value })
                  }
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
                  disabled={saving || form.amount <= 0}
                  className="btn btn-info"
                >
                  {saving ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    "Valider le règlement"
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setModalOpen(false)} />
        </div>
      )}
    </div>
  );
}
