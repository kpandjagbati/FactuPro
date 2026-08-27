"use client";

import { getClients } from "@/app/actions";
import { ensureQuotePublicToken } from "@/app/actions-portal";
import {
  convertQuoteToInvoice,
  deleteQuote,
  duplicateQuote,
  emailQuote,
  getQuoteById,
  updateQuote,
} from "@/app/actions-v2";
import DocumentLinesEditor from "@/app/components/DocumentLinesEditor";
import VATControl from "@/app/components/VATControl";
import Wrapper from "@/app/components/Wrapper";
import { handleEmailResult } from "@/lib/email-client";
import { formatMoney, toDateInputValue } from "@/lib/format";
import type { Client, Quote, QuoteStatus, Totals } from "@/type";
import { QUOTE_STATUS_LABELS, QUOTE_STATUSES } from "@/type";
import {
  CheckCircle2,
  Copy,
  Eye,
  FileCheck,
  FileInput,
  Mail,
  Save,
  Trash,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function QuoteDetailPage() {
  const params = useParams<{ quoteId: string }>();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [initial, setInitial] = useState<Quote | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [q, c] = await Promise.all([
          getQuoteById(params.quoteId),
          getClients(),
        ]);
        setQuote(q);
        setInitial(q);
        setClients(c);
      } catch {
        setNotFound(true);
      }
    };
    if (params.quoteId) void load();
  }, [params.quoteId]);

  useEffect(() => {
    if (!quote) return;
    const ht = quote.lines.reduce(
      (acc, l) => acc + l.quantity * l.unitPrice,
      0,
    );
    const vat = quote.vatActive ? ht * (quote.vatRate / 100) : 0;
    setTotals({ totalHT: ht, totalVAT: vat, totalTTC: ht + vat });
  }, [quote]);

  const dirty = JSON.stringify(quote) !== JSON.stringify(initial);

  const handleSave = async () => {
    if (!quote) return;
    setSaving(true);
    try {
      const updated = await updateQuote(quote);
      setQuote(updated);
      setInitial(updated);
    } catch (error) {
      console.error(error);
      alert("Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleConvert = async () => {
    if (!quote) return;
    if (dirty) {
      alert("Sauvegardez le devis avant de le convertir.");
      return;
    }
    if (!window.confirm("Convertir ce devis en facture ?")) return;
    setConverting(true);
    try {
      const invoice = await convertQuoteToInvoice(quote.id);
      router.push(`/invoice/${invoice.id}`);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Conversion impossible");
    } finally {
      setConverting(false);
    }
  };

  const handleDelete = async () => {
    if (!quote || !window.confirm("Supprimer ce devis ?")) return;
    await deleteQuote(quote.id);
    router.push("/quotes");
  };

  const handleEmail = async () => {
    if (!quote) return;
    if (dirty) {
      alert("Sauvegardez le devis avant l'envoi.");
      return;
    }
    if (!quote.clientEmail?.trim()) {
      alert("Ajoutez l'email du client avant l'envoi.");
      return;
    }
    setEmailing(true);
    try {
      const result = await emailQuote(quote.id);
      const mode = handleEmailResult(result, "devis");
      if (mode === "resend") {
        const refreshed = await getQuoteById(quote.id);
        setQuote(refreshed);
        setInitial(refreshed);
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

  const handleDuplicate = async () => {
    if (!quote) return;
    setDuplicating(true);
    try {
      const copy = await duplicateQuote(quote.id);
      router.push(`/quote/${copy.id}`);
    } catch (error) {
      console.error(error);
      alert("Impossible de dupliquer le devis.");
    } finally {
      setDuplicating(false);
    }
  };

  const handleCopyPublicLink = async () => {
    if (!quote) return;
    try {
      let activeToken = quote.publicToken;
      if (!activeToken) {
        activeToken = await ensureQuotePublicToken(quote.id);
        setQuote({ ...quote, publicToken: activeToken });
      }

      const url = `${window.location.origin}/view/quote/${activeToken}`;
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error(err);
      alert("Impossible de générer le lien de partage.");
    }
  };

  if (notFound) {
    return (
      <Wrapper>
        <p className="font-bold">Devis non trouvé</p>
      </Wrapper>
    );
  }

  if (!quote || !totals) {
    return (
      <Wrapper>
        <span className="loading loading-spinner loading-lg text-info" />
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="badge badge-ghost badge-lg max-w-full whitespace-normal uppercase">
          {quote.number}
          <span className="ml-2 opacity-60">· {quote.name}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <select
            className="select select-sm select-bordered"
            value={quote.status}
            disabled={quote.status === "CONVERTED"}
            onChange={(e) =>
              setQuote({ ...quote, status: e.target.value as QuoteStatus })
            }
          >
            {QUOTE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {QUOTE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleCopyPublicLink}
            className="btn btn-sm btn-outline gap-1"
            title="Lien public pour le client et signature"
          >
            {copiedLink ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-success">Lien copié !</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Lien client</span>
              </>
            )}
          </button>

          <button
            className="btn btn-sm btn-info"
            disabled={!dirty || saving || quote.status === "CONVERTED"}
            onClick={handleSave}
          >
            {saving ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <>
                Sauvegarder <Save className="ml-1 w-4" />
              </>
            )}
          </button>

          <button
            className="btn btn-sm btn-secondary"
            disabled={emailing || quote.status === "CONVERTED"}
            onClick={handleEmail}
          >
            {emailing ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <>
                Email <Mail className="ml-1 w-4" />
              </>
            )}
          </button>

          {quote.status !== "CONVERTED" && (
            <button
              className="btn btn-sm btn-success"
              disabled={converting}
              onClick={handleConvert}
            >
              {converting ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  → Facture <FileInput className="ml-1 w-4" />
                </>
              )}
            </button>
          )}

          <button
            className="btn btn-sm btn-ghost"
            disabled={duplicating}
            onClick={handleDuplicate}
          >
            {duplicating ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <>
                Dupliquer <Copy className="ml-1 w-4" />
              </>
            )}
          </button>

          <button className="btn btn-sm btn-error" onClick={handleDelete}>
            <Trash className="w-4" />
          </button>
        </div>
      </div>

      {/* Bannière de consultation / signature */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {quote.viewedAt && (
          <div className="flex items-center gap-1.5 text-xs text-info bg-info/10 rounded-lg px-3 py-1.5">
            <Eye className="h-3.5 w-3.5" />
            Consulté en ligne par le client le{" "}
            {new Date(quote.viewedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}

        {quote.signedAt && (
          <div className="flex items-center gap-1.5 text-xs text-success bg-success/10 rounded-lg px-3 py-1.5 font-medium">
            <FileCheck className="h-4 w-4" />
            Signé électroniquement par <strong>{quote.signedByName || "Client"}</strong> le{" "}
            {new Date(quote.signedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="w-full space-y-4 md:w-1/3">
          <div className="rounded-xl bg-base-200 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="badge badge-info">Totaux</div>
              <VATControl document={quote} setDocument={setQuote} />
            </div>
            <div className="flex justify-between">
              <span>HT</span>
              <span>{formatMoney(totals.totalHT, quote.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>TVA</span>
              <span>{formatMoney(totals.totalVAT, quote.currency)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>TTC</span>
              <span>{formatMoney(totals.totalTTC, quote.currency)}</span>
            </div>
          </div>

          <div className="space-y-3 rounded-xl bg-base-200 p-5">
            <h2 className="badge badge-info">Émetteur</h2>
            <input
              className="input input-bordered w-full"
              value={quote.issuerName}
              onChange={(e) => setQuote({ ...quote, issuerName: e.target.value })}
            />
            <textarea
              className="textarea textarea-bordered w-full"
              value={quote.issuerAddress}
              onChange={(e) =>
                setQuote({ ...quote, issuerAddress: e.target.value })
              }
            />
            <h2 className="badge badge-info">Client</h2>
            <select
              className="select select-bordered w-full"
              value={quote.clientId || ""}
              onChange={(e) => {
                const client = clients.find((c) => c.id === e.target.value);
                if (!client) return;
                setQuote({
                  ...quote,
                  clientId: client.id,
                  clientName: client.name,
                  clientAddress: client.address || "",
                  clientEmail: client.email || "",
                });
              }}
            >
              <option value="">Choisir un client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              className="input input-bordered w-full"
              placeholder="Nom client"
              value={quote.clientName}
              onChange={(e) => setQuote({ ...quote, clientName: e.target.value })}
            />
            <input
              type="email"
              className="input input-bordered w-full"
              placeholder="Email du client (pour envoi)"
              value={quote.clientEmail || ""}
              onChange={(e) =>
                setQuote({ ...quote, clientEmail: e.target.value })
              }
            />
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="Adresse"
              value={quote.clientAddress}
              onChange={(e) =>
                setQuote({ ...quote, clientAddress: e.target.value })
              }
            />
            <input
              type="date"
              className="input input-bordered w-full"
              value={toDateInputValue(quote.quoteDate)}
              onChange={(e) => setQuote({ ...quote, quoteDate: e.target.value as unknown as Date })}
            />
            <input
              type="date"
              className="input input-bordered w-full"
              value={toDateInputValue(quote.validUntil)}
              onChange={(e) =>
                setQuote({ ...quote, validUntil: e.target.value as unknown as Date })
              }
            />
            <h2 className="badge badge-info">Notes</h2>
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="Notes ou remarques…"
              value={quote.notes || ""}
              onChange={(e) => setQuote({ ...quote, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="w-full md:w-2/3">
          <DocumentLinesEditor
            title="Lignes"
            currency={quote.currency}
            lines={quote.lines.map(({ id, description, quantity, unitPrice }) => ({
              id,
              description,
              quantity,
              unitPrice,
            }))}
            onChange={(next) =>
              setQuote({
                ...quote,
                lines: next.map((line) => ({ ...line, quoteId: quote.id })),
              })
            }
          />
        </div>
      </div>
    </Wrapper>
  );
}
