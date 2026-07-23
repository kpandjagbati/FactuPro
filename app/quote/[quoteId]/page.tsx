"use client";

import { getClients } from "@/app/actions";
import {
  convertQuoteToInvoice,
  deleteQuote,
  getQuoteById,
  updateQuote,
} from "@/app/actions-v2";
import VATControl from "@/app/components/VATControl";
import Wrapper from "@/app/components/Wrapper";
import { formatMoney, toDateInputValue } from "@/lib/format";
import type { Client, Quote, QuoteLine, QuoteStatus, Totals } from "@/type";
import { QUOTE_STATUS_LABELS, QUOTE_STATUSES } from "@/type";
import { FileInput, Plus, Save, Trash } from "lucide-react";
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
  const [notFound, setNotFound] = useState(false);

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

  const addLine = () => {
    if (!quote) return;
    const line: QuoteLine = {
      id: `temp-${Date.now()}`,
      quoteId: quote.id,
      description: "",
      quantity: 1,
      unitPrice: 0,
    };
    setQuote({ ...quote, lines: [...quote.lines, line] });
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
        <p className="badge badge-ghost badge-lg uppercase">
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
          <button className="btn btn-sm btn-error" onClick={handleDelete}>
            <Trash className="w-4" />
          </button>
        </div>
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
          </div>
        </div>

        <div className="w-full rounded-xl bg-base-200 p-5 md:w-2/3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="badge badge-info">Lignes</h2>
            <button className="btn btn-sm btn-info" onClick={addLine}>
              <Plus className="w-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Qté</th>
                  <th>Description</th>
                  <th>Prix</th>
                  <th>Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {quote.lines.map((line, index) => (
                  <tr key={line.id}>
                    <td>
                      <input
                        type="number"
                        className="input input-sm input-bordered w-20"
                        value={line.quantity}
                        onChange={(e) => {
                          const lines = [...quote.lines];
                          lines[index] = {
                            ...line,
                            quantity: parseInt(e.target.value, 10) || 0,
                          };
                          setQuote({ ...quote, lines });
                        }}
                      />
                    </td>
                    <td>
                      <input
                        className="input input-sm input-bordered w-full min-w-40"
                        value={line.description}
                        onChange={(e) => {
                          const lines = [...quote.lines];
                          lines[index] = {
                            ...line,
                            description: e.target.value,
                          };
                          setQuote({ ...quote, lines });
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input input-sm input-bordered w-28"
                        value={line.unitPrice}
                        onChange={(e) => {
                          const lines = [...quote.lines];
                          lines[index] = {
                            ...line,
                            unitPrice: parseFloat(e.target.value) || 0,
                          };
                          setQuote({ ...quote, lines });
                        }}
                      />
                    </td>
                    <td className="whitespace-nowrap font-bold">
                      {formatMoney(line.quantity * line.unitPrice, quote.currency)}
                    </td>
                    <td>
                      <button
                        className="btn btn-circle btn-sm btn-info"
                        onClick={() =>
                          setQuote({
                            ...quote,
                            lines: quote.lines.filter((_, i) => i !== index),
                          })
                        }
                      >
                        <Trash className="w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
