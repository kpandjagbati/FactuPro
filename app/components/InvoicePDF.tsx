"use client";

import type { CompanyProfile, Invoice, Totals } from "@/type";
import { formatDisplayDate, formatMoney } from "@/lib/format";
import confetti from "canvas-confetti";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { ArrowDownFromLine, LayersPlus } from "lucide-react";
import { useRef } from "react";

interface FacturePDFProps {
  invoice: Invoice;
  totals: Totals;
  company?: CompanyProfile | null;
}

const BLUE = "#0284c7";
const INK = "#0f172a";
const MUTED = "#64748b";
const LINE = "#e2e8f0";
const SOFT = "#f8fafc";

const InvoicePDF = ({ invoice, totals, company }: FacturePDFProps) => {
  const factureRef = useRef<HTMLDivElement>(null);
  const logoSrc = company?.logoUrl?.startsWith("data:")
    ? company.logoUrl
    : company?.logoUrl?.split("?")[0];

  const handleDownloadPdf = async () => {
    const element = factureRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "A4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
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

      pdf.save(`facture-${invoice.number}.pdf`);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 9999,
      });
    } catch (error) {
      console.error("Erreur lors de la génération du PDF :", error);
    }
  };

  const cell: React.CSSProperties = {
    padding: "10px 12px",
    borderBottom: `1px solid ${LINE}`,
    fontSize: 13,
    color: INK,
    verticalAlign: "top",
  };

  const th: React.CSSProperties = {
    ...cell,
    background: SOFT,
    color: MUTED,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    borderBottom: `2px solid ${LINE}`,
  };

  return (
    <div className="mt-4 block">
      <div className="rounded-xl border-2 border-dashed border-base-300 p-5">
        <button onClick={handleDownloadPdf} className="btn btn-sm btn-info mb-4">
          Facture PDF
          <ArrowDownFromLine className="w-4" />
        </button>

        <div className="overflow-x-auto bg-base-200/40 p-2 sm:p-4">
          <div className="pdf-preview-scale mx-auto w-fit max-w-full">
            <div
              ref={factureRef}
              className="pdf-preview-page"
              style={{
                width: 794,
                background: "#ffffff",
                color: INK,
                fontFamily:
                  'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
                padding: 40,
                boxSizing: "border-box",
              }}
            >
            {/* Bandeau */}
            <div
              style={{
                height: 6,
                background: BLUE,
                borderRadius: 999,
                marginBottom: 28,
              }}
            />

            {/* En-tête */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 24,
                marginBottom: 32,
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 16,
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
                        objectFit: "contain",
                        borderRadius: 8,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 44,
                        width: 44,
                        borderRadius: 10,
                        background: BLUE,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <LayersPlus size={22} color="#fff" />
                    </div>
                  )}
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
                    Factu<span style={{ color: BLUE }}>Pro</span>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  FACTURE
                </div>
                <div style={{ marginTop: 8, color: MUTED, fontSize: 13 }}>
                  {invoice.name}
                </div>
              </div>

              <div
                style={{
                  minWidth: 220,
                  background: SOFT,
                  border: `1px solid ${LINE}`,
                  borderRadius: 12,
                  padding: "16px 18px",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: BLUE,
                    marginBottom: 10,
                  }}
                >
                  {invoice.number}
                </div>
                <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: INK }}>Date </span>
                  {formatDisplayDate(invoice.invoiceDate)}
                </div>
                <div style={{ fontSize: 12, color: MUTED }}>
                  <span style={{ fontWeight: 700, color: INK }}>Échéance </span>
                  {formatDisplayDate(invoice.dueDate)}
                </div>
              </div>
            </div>

            {/* Émetteur / Client */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  border: `1px solid ${LINE}`,
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: BLUE,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 10,
                  }}
                >
                  Émetteur
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                  {invoice.issuerName || "—"}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: MUTED,
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.45,
                  }}
                >
                  {invoice.issuerAddress || "—"}
                </div>
                {company?.taxId && (
                  <div style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>
                    IFU / NIF : {company.taxId}
                  </div>
                )}
                {company?.iban && (
                  <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
                    IBAN : {company.iban}
                  </div>
                )}
              </div>

              <div
                style={{
                  border: `1px solid ${LINE}`,
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: BLUE,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 10,
                  }}
                >
                  Client
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                  {invoice.clientName || "—"}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: MUTED,
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.45,
                  }}
                >
                  {invoice.clientAddress || "—"}
                </div>
                {invoice.clientEmail && (
                  <div style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>
                    {invoice.clientEmail}
                  </div>
                )}
              </div>
            </div>

            {/* Tableau */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed",
                marginBottom: 24,
              }}
            >
              <colgroup>
                <col style={{ width: "8%" }} />
                <col style={{ width: "42%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "18%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ ...th, textAlign: "left" }}>#</th>
                  <th style={{ ...th, textAlign: "left" }}>Description</th>
                  <th style={{ ...th, textAlign: "right" }}>Qté</th>
                  <th style={{ ...th, textAlign: "right" }}>Prix unit.</th>
                  <th style={{ ...th, textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ ...cell, textAlign: "center", color: MUTED }}
                    >
                      Aucune ligne
                    </td>
                  </tr>
                ) : (
                  invoice.lines.map((ligne, index) => (
                    <tr key={ligne.id}>
                      <td style={{ ...cell, textAlign: "left", color: MUTED }}>
                        {index + 1}
                      </td>
                      <td style={{ ...cell, textAlign: "left", fontWeight: 500 }}>
                        {ligne.description || "—"}
                      </td>
                      <td style={{ ...cell, textAlign: "right" }}>
                        {ligne.quantity}
                      </td>
                      <td style={{ ...cell, textAlign: "right" }}>
                        {formatMoney(ligne.unitPrice, invoice.currency)}
                      </td>
                      <td style={{ ...cell, textAlign: "right", fontWeight: 700 }}>
                        {formatMoney(
                          ligne.quantity * ligne.unitPrice,
                          invoice.currency,
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Totaux */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: 280 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    fontSize: 13,
                    color: MUTED,
                    borderBottom: `1px solid ${LINE}`,
                  }}
                >
                  <span>Total HT</span>
                  <span style={{ color: INK, fontWeight: 600 }}>
                    {formatMoney(totals.totalHT, invoice.currency)}
                  </span>
                </div>
                {invoice.vatActive && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      fontSize: 13,
                      color: MUTED,
                      borderBottom: `1px solid ${LINE}`,
                    }}
                  >
                    <span>TVA ({invoice.vatRate} %)</span>
                    <span style={{ color: INK, fontWeight: 600 }}>
                      {formatMoney(totals.totalVAT, invoice.currency)}
                    </span>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 10,
                    padding: "12px 14px",
                    background: BLUE,
                    color: "#fff",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  <span>Total TTC</span>
                  <span>{formatMoney(totals.totalTTC, invoice.currency)}</span>
                </div>
              </div>
            </div>

            {/* Notes & conditions */}
            {(invoice.notes || company?.paymentTerms) && (
              <div
                style={{
                  marginTop: 28,
                  display: "grid",
                  gridTemplateColumns: invoice.notes && company?.paymentTerms ? "1fr 1fr" : "1fr",
                  gap: 16,
                }}
              >
                {company?.paymentTerms && (
                  <div
                    style={{
                      border: `1px solid ${LINE}`,
                      borderRadius: 12,
                      padding: 14,
                      background: SOFT,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: BLUE,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: 8,
                      }}
                    >
                      Conditions de paiement
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: MUTED,
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.5,
                      }}
                    >
                      {company.paymentTerms}
                    </div>
                  </div>
                )}
                {invoice.notes && (
                  <div
                    style={{
                      border: `1px solid ${LINE}`,
                      borderRadius: 12,
                      padding: 14,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: BLUE,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: 8,
                      }}
                    >
                      Notes
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: MUTED,
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.5,
                      }}
                    >
                      {invoice.notes}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pied */}
            <div
              style={{
                marginTop: 36,
                paddingTop: 16,
                borderTop: `1px solid ${LINE}`,
                fontSize: 11,
                color: MUTED,
                lineHeight: 1.5,
              }}
            >
              Document généré avec FactuPro
              {company?.name ? ` — ${company.name}` : ""}.
              {company?.phone ? ` Tél. ${company.phone}.` : ""}
              {company?.email ? ` ${company.email}` : ""}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePDF;
