"use client";

import { useState, useRef } from "react";
import { formatDisplayDate, formatMoney } from "@/lib/format";
import type { CompanyProfile, Quote, Totals } from "@/type";
import { rejectQuotePublic, signQuotePublic } from "@/app/actions-portal";
import SignaturePad from "./SignaturePad";
import confetti from "canvas-confetti";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import {
  ArrowDownFromLine,
  Check,
  CheckCircle,
  FileSignature,
  LayersPlus,
  X,
  XCircle,
} from "lucide-react";

interface Props {
  quote: Quote & {
    signedAt?: Date | null;
    signedByName?: string | null;
    signatureData?: string | null;
  };
  totals: Totals;
  company?: CompanyProfile | null;
  token: string;
}

export default function PublicQuoteView({
  quote: initialQuote,
  totals,
  company,
  token,
}: Props) {
  const [quote, setQuote] = useState(initialQuote);
  const quoteRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signerName, setSignerName] = useState(quote.clientName || "");
  const [signatureData, setSignatureData] = useState("");
  const [signing, setSigning] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const logoSrc = company?.logoUrl?.startsWith("data:")
    ? company.logoUrl
    : company?.logoUrl?.split("?")[0];

  const handleDownloadPdf = async () => {
    const element = quoteRef.current;
    if (!element || isGenerating) return;

    setIsGenerating(true);
    let wrapper: HTMLDivElement | null = null;

    try {
      const clone = element.cloneNode(true) as HTMLDivElement;
      wrapper = document.createElement("div");
      wrapper.style.position = "fixed";
      wrapper.style.top = "-99999px";
      wrapper.style.left = "-99999px";
      wrapper.style.width = "794px";
      wrapper.style.zIndex = "-9999";
      wrapper.style.transform = "none";
      wrapper.style.margin = "0";
      wrapper.style.padding = "0";

      clone.style.transform = "none";
      clone.style.width = "794px";
      clone.style.margin = "0";

      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: 794,
        windowWidth: 1024,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * usableWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        position = margin - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      pdf.save(`devis-${quote.number || "devis"}.pdf`);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 9999,
      });
    } catch (error) {
      console.error("Erreur téléchargement PDF :", error);
    } finally {
      if (wrapper && wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }
      setIsGenerating(false);
    }
  };

  const handleSignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim()) {
      alert("Veuillez renseigner votre nom complet.");
      return;
    }
    if (!signatureData) {
      alert("Veuillez tracer votre signature ci-dessous.");
      return;
    }

    setSigning(true);
    try {
      const updated = await signQuotePublic({
        publicToken: token,
        signerName: signerName.trim(),
        signatureData,
      });

      setQuote({
        ...quote,
        status: updated.status,
        signedAt: updated.signedAt,
        signedByName: updated.signedByName,
        signatureData: updated.signatureData,
      });

      setSignModalOpen(false);
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
      });
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Erreur lors de la signature.");
    } finally {
      setSigning(false);
    }
  };

  const handleReject = async () => {
    if (!confirm("Êtes-vous sûr de vouloir refuser ce devis ?")) return;

    setRejecting(true);
    try {
      const updated = await rejectQuotePublic({ publicToken: token });
      setQuote({
        ...quote,
        status: updated.status,
      });
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Erreur lors du refus.");
    } finally {
      setRejecting(false);
    }
  };

  const isSigned =
    quote.status === "ACCEPTED" || quote.status === "CONVERTED";
  const isRejected = quote.status === "REJECTED";

  return (
    <div className="space-y-6">
      {/* Barre d'action rapide */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-base-100 p-4 shadow-sm border border-base-300">
        <button
          onClick={handleDownloadPdf}
          disabled={isGenerating}
          className="btn btn-outline btn-sm sm:btn-md gap-2"
        >
          {isGenerating ? "Téléchargement..." : "Télécharger le PDF"}
          <ArrowDownFromLine className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          {!isSigned && !isRejected && (
            <>
              <button
                onClick={handleReject}
                disabled={rejecting}
                className="btn btn-ghost btn-sm sm:btn-md text-error"
              >
                Refuser
              </button>
              <button
                onClick={() => setSignModalOpen(true)}
                className="btn btn-success btn-sm sm:btn-md text-white gap-2 shadow"
              >
                <FileSignature className="h-4 w-4" />
                Accepter & Signer le devis
              </button>
            </>
          )}

          {isSigned && (
            <div className="flex items-center gap-2 text-success font-semibold text-sm">
              <CheckCircle className="h-5 w-5" />
              Devis accepté et validé
            </div>
          )}
        </div>
      </div>

      {/* Bloc de signature visible si le devis est signé */}
      {isSigned && quote.signatureData && (
        <div className="rounded-2xl border border-success/30 bg-success/5 p-5 text-sm">
          <div className="flex items-center gap-2 font-bold text-success">
            <CheckCircle className="h-5 w-5" />
            Signature électronique enregistrée
          </div>
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-base-content/70">
                Signé par : <strong>{quote.signedByName || "Client"}</strong>
              </p>
              <p className="text-xs text-base-content/70 mt-0.5">
                Date et heure :{" "}
                <strong>
                  {quote.signedAt
                    ? new Date(quote.signedAt).toLocaleString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </strong>
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={quote.signatureData}
              alt="Signature client"
              className="h-16 max-w-[200px] object-contain rounded border border-base-300 bg-white p-1"
            />
          </div>
        </div>
      )}

      {/* Affichage du document Devis */}
      <div className="overflow-x-auto rounded-2xl bg-base-100 p-2 sm:p-4 shadow-sm border border-base-300">
        <div className="pdf-preview-scale mx-auto w-fit max-w-full">
          <div
            ref={quoteRef}
            className="pdf-preview-page"
            style={{
              width: 794,
              backgroundColor: "#ffffff",
              color: "#0f172a",
              fontFamily:
                'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              padding: "36px 40px",
              boxSizing: "border-box",
              lineHeight: 1.4,
            }}
          >
            {/* En-tête */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                fontSize: 14,
                marginBottom: 28,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  {logoSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoSrc}
                      alt="Logo"
                      style={{
                        height: 48,
                        width: 48,
                        borderRadius: 0,
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        borderRadius: 0,
                        backgroundColor: "#0284c7",
                        padding: 8,
                        color: "#ffffff",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <LayersPlus style={{ width: 24, height: 24, color: "#ffffff" }} />
                    </div>
                  )}
                  <span
                    style={{
                      marginLeft: 12,
                      fontSize: 26,
                      fontWeight: 800,
                      fontStyle: "italic",
                      color: "#0f172a",
                      lineHeight: 1,
                    }}
                  >
                    Factu<span style={{ color: "#0284c7" }}>Pro</span>
                  </span>
                </div>

                <h1
                  style={{
                    fontSize: 40,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                    margin: "6px 0 0 0",
                    color: "#0f172a",
                  }}
                >
                  DEVIS
                </h1>
                {quote.name && (
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: 14,
                      color: "#64748b",
                      fontWeight: 500,
                      lineHeight: 1.3,
                    }}
                  >
                    {quote.name}
                  </p>
                )}
              </div>

              <div
                style={{
                  textAlign: "right",
                  textTransform: "uppercase",
                  minWidth: 200,
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <span
                    style={{
                      display: "inline-block",
                      backgroundColor: "#f1f5f9",
                      color: "#334155",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "5px 12px",
                      borderRadius: 0,
                      lineHeight: 1.2,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {quote.number || "—"}
                  </span>
                </div>
                <p
                  style={{
                    margin: "4px 0",
                    fontSize: 13,
                    color: "#475569",
                    lineHeight: 1.4,
                  }}
                >
                  <strong style={{ color: "#0f172a" }}>Date </strong>
                  {formatDisplayDate(quote.quoteDate)}
                </p>
                <p
                  style={{
                    margin: "4px 0",
                    fontSize: 13,
                    color: "#475569",
                    lineHeight: 1.4,
                  }}
                >
                  <strong style={{ color: "#0f172a" }}>Validité </strong>
                  {formatDisplayDate(quote.validUntil)}
                </p>
              </div>
            </div>

            {/* Émetteur & Client */}
            <div
              style={{
                margin: "24px 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 24,
              }}
            >
              <div style={{ flex: 1, maxWidth: 320 }}>
                <span
                  style={{
                    display: "inline-block",
                    backgroundColor: "#f1f5f9",
                    color: "#334155",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 0,
                    marginBottom: 8,
                    textTransform: "uppercase",
                    lineHeight: 1.2,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  Émetteur
                </span>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    fontStyle: "italic",
                    color: "#0f172a",
                    margin: "0 0 4px 0",
                    lineHeight: 1.3,
                  }}
                >
                  {quote.issuerName || "—"}
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.45,
                    margin: 0,
                  }}
                >
                  {quote.issuerAddress || "—"}
                </p>
                {company?.taxId && (
                  <p
                    style={{
                      margin: "6px 0 0 0",
                      fontSize: 12,
                      color: "#64748b",
                      lineHeight: 1.3,
                    }}
                  >
                    IFU/NIF : {company.taxId}
                  </p>
                )}
                {company?.iban && (
                  <p
                    style={{
                      margin: "2px 0 0 0",
                      fontSize: 12,
                      color: "#64748b",
                      lineHeight: 1.3,
                    }}
                  >
                    IBAN : {company.iban}
                  </p>
                )}
              </div>

              <div style={{ flex: 1, maxWidth: 320, textAlign: "right" }}>
                <span
                  style={{
                    display: "inline-block",
                    backgroundColor: "#f1f5f9",
                    color: "#334155",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 0,
                    marginBottom: 8,
                    textTransform: "uppercase",
                    lineHeight: 1.2,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  Client
                </span>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    fontStyle: "italic",
                    color: "#0f172a",
                    margin: "0 0 4px 0",
                    lineHeight: 1.3,
                  }}
                >
                  {quote.clientName || "—"}
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.45,
                    margin: 0,
                    marginLeft: "auto",
                  }}
                >
                  {quote.clientAddress || "—"}
                </p>
                {quote.clientEmail && (
                  <p
                    style={{
                      margin: "6px 0 0 0",
                      fontSize: 12,
                      color: "#64748b",
                      lineHeight: 1.3,
                    }}
                  >
                    {quote.clientEmail}
                  </p>
                )}
              </div>
            </div>

            {/* Tableau */}
            <div style={{ width: "100%", margin: "24px 0" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                  textAlign: "left",
                  lineHeight: 1.4,
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid #cbd5e1",
                      color: "#475569",
                      backgroundColor: "#f8fafc",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <th style={{ padding: "10px 12px", width: "30px" }}></th>
                    <th style={{ padding: "10px 12px" }}>Description</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", width: "90px" }}>
                      Quantité
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "right", width: "130px" }}>
                      Prix unitaire
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "right", width: "130px" }}>
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {quote.lines.map((ligne, index) => (
                    <tr
                      key={ligne.id}
                      style={{
                        backgroundColor: index % 2 === 1 ? "#f8fafc" : "#ffffff",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      <td style={{ padding: "10px 12px", color: "#94a3b8" }}>
                        {index + 1}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          fontWeight: 500,
                          color: "#0f172a",
                        }}
                      >
                        {ligne.description || "—"}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "#334155" }}>
                        {ligne.quantity}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "#334155" }}>
                        {formatMoney(ligne.unitPrice, quote.currency)}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          textAlign: "right",
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {formatMoney(
                          ligne.quantity * ligne.unitPrice,
                          quote.currency,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totaux */}
            <div
              style={{
                marginTop: 20,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                fontSize: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#334155",
                  lineHeight: 1.4,
                }}
              >
                <div style={{ fontWeight: 700, color: "#0f172a" }}>
                  Total Hors Taxes
                </div>
                <div>{formatMoney(totals.totalHT, quote.currency)}</div>
              </div>

              {quote.vatActive && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#334155",
                    lineHeight: 1.4,
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>
                    TVA {quote.vatRate} %
                  </div>
                  <div>{formatMoney(totals.totalVAT, quote.currency)}</div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  color: "#0f172a",
                  paddingTop: 8,
                  borderTop: "2px solid #0f172a",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 16 }}>Total TTC</div>
                <div
                  style={{
                    backgroundColor: "#0284c7",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: 15,
                    padding: "8px 16px",
                    borderRadius: 0,
                    display: "inline-block",
                    lineHeight: 1.2,
                  }}
                >
                  {formatMoney(totals.totalTTC, quote.currency)}
                </div>
              </div>
            </div>

            {/* Notes */}
            {quote.notes && (
              <div
                style={{
                  marginTop: 28,
                  paddingTop: 14,
                  borderTop: "1px solid #e2e8f0",
                  fontSize: 11,
                  color: "#64748b",
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: "#334155" }}>Notes & Modalités : </strong>
                {quote.notes}
              </div>
            )}

            {/* Signature imprimée dans le devis si signé */}
            {isSigned && quote.signatureData && (
              <div
                style={{
                  marginTop: 32,
                  paddingTop: 16,
                  borderTop: "2px dashed #cbd5e1",
                  display: "flex",
                  justifyContent: "flex-end",
                  textAlign: "right",
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase" }}>
                    Bon pour accord (Signé électroniquement)
                  </div>
                  <div style={{ fontSize: 12, color: "#334155", marginTop: 4 }}>
                    Signataire : <strong>{quote.signedByName}</strong>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    Le {new Date(quote.signedAt!).toLocaleDateString("fr-FR")}
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={quote.signatureData}
                    alt="Signature"
                    style={{
                      height: 50,
                      marginTop: 6,
                      marginLeft: "auto",
                      objectFit: "contain",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de signature électronique */}
      {signModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <div className="flex items-center justify-between pb-3 border-b border-base-300">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-success" />
                Validation & Signature du devis
              </h3>
              <button
                onClick={() => setSignModalOpen(false)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSignSubmit} className="mt-4 space-y-4">
              <p className="text-xs text-base-content/70">
                En signant ce document, vous confirmez votre accord pour l&apos;exécution des prestations décrites dans le devis n° <strong>{quote.number}</strong> pour un montant total de <strong>{formatMoney(totals.totalTTC, quote.currency)}</strong>.
              </p>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Nom complet du signataire *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Armand Kpandja"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="input input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Votre signature manuscrite *</span>
                </label>
                <SignaturePad onSave={(data) => setSignatureData(data)} />
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => setSignModalOpen(false)}
                  className="btn btn-ghost"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={signing || !signatureData || !signerName.trim()}
                  className="btn btn-success text-white"
                >
                  {signing ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    "Confirmer et signer"
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setSignModalOpen(false)} />
        </div>
      )}
    </div>
  );
}
