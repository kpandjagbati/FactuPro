"use client";

import { formatDisplayDate, formatMoney } from "@/lib/format";
import type { CompanyProfile, CreditNote, Totals } from "@/type";
import confetti from "canvas-confetti";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { ArrowDownFromLine, LayersPlus } from "lucide-react";
import { useRef, useState } from "react";

interface Props {
  creditNote: CreditNote;
  totals: Totals;
  company?: CompanyProfile | null;
}

export default function CreditNotePDF({ creditNote, totals, company }: Props) {
  const avoirRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const brandColor = company?.primaryColor || "#0284c7";

  const logoSrc = company?.logoUrl?.startsWith("data:")
    ? company.logoUrl
    : company?.logoUrl?.split("?")[0];

  const handleDownloadPdf = async () => {
    const element = avoirRef.current;
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

      pdf.save(`avoir-${creditNote.number || "avoir"}.pdf`);

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

  return (
    <div className="mt-4 flex flex-col items-center">
      <div className="flex w-full justify-end pb-3">
        <button
          onClick={handleDownloadPdf}
          disabled={isGenerating}
          className="btn btn-error text-white btn-sm gap-2"
        >
          {isGenerating ? "Génération..." : "Télécharger l'avoir (PDF)"}
          <ArrowDownFromLine className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-x-auto w-full rounded-2xl bg-base-100 p-2 sm:p-4 shadow-sm border border-base-300">
        <div className="pdf-preview-scale mx-auto w-fit max-w-full">
          <div
            ref={avoirRef}
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
                        backgroundColor: brandColor,
                        padding: 8,
                        color: "#ffffff",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 44,
                        height: 44,
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
                    Factu<span style={{ color: brandColor }}>Pro</span>
                  </span>
                </div>

                <h1
                  style={{
                    fontSize: 38,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                    margin: "6px 0 0 0",
                    color: "#dc2626",
                  }}
                >
                  NOTE D&apos;AVOIR
                </h1>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: 13,
                    color: "#64748b",
                    fontWeight: 500,
                  }}
                >
                  Motif : {creditNote.reason}
                </p>
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
                      backgroundColor: "#fee2e2",
                      color: "#991b1b",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "5px 12px",
                      borderRadius: 0,
                      lineHeight: 1.2,
                      border: "1px solid #fecaca",
                    }}
                  >
                    {creditNote.number}
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
                  <strong style={{ color: "#0f172a" }}>Date : </strong>
                  {formatDisplayDate(creditNote.creditDate)}
                </p>
                {creditNote.invoice && (
                  <p
                    style={{
                      margin: "4px 0",
                      fontSize: 13,
                      color: "#475569",
                      lineHeight: 1.4,
                    }}
                  >
                    <strong style={{ color: "#0f172a" }}>Réf Facture : </strong>
                    {creditNote.invoice.number}
                  </p>
                )}
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
                  {creditNote.issuerName || "—"}
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
                  {creditNote.issuerAddress || "—"}
                </p>
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
                  Bénéficiaire / Client
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
                  {creditNote.clientName || "—"}
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
                  {creditNote.clientAddress || "—"}
                </p>
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
                    <th style={{ padding: "10px 12px" }}>Description de l&apos;avoir</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", width: "90px" }}>
                      Qté
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "right", width: "130px" }}>
                      Prix unitaire
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "right", width: "130px" }}>
                      Crédit TTC
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {creditNote.lines.map((ligne, index) => (
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
                      <td style={{ padding: "10px 12px", fontWeight: 500 }}>
                        {ligne.description}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        {ligne.quantity}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        {formatMoney(ligne.unitPrice, creditNote.currency)}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          textAlign: "right",
                          fontWeight: 700,
                          color: "#dc2626",
                        }}
                      >
                        - {formatMoney(ligne.quantity * ligne.unitPrice, creditNote.currency)}
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
                }}
              >
                <div style={{ fontWeight: 700 }}>Total HT à déduire</div>
                <div>- {formatMoney(totals.totalHT, creditNote.currency)}</div>
              </div>

              {creditNote.vatActive && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#334155",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>
                    TVA ({creditNote.vatRate} %)
                  </div>
                  <div>- {formatMoney(totals.totalVAT, creditNote.currency)}</div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 8,
                  borderTop: "2px solid #dc2626",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 16 }}>
                  Total Avoir TTC
                </div>
                <div
                  style={{
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: 15,
                    padding: "8px 16px",
                    borderRadius: 0,
                  }}
                >
                  - {formatMoney(totals.totalTTC, creditNote.currency)}
                </div>
              </div>
            </div>

            {creditNote.notes && (
              <div
                style={{
                  marginTop: 28,
                  paddingTop: 14,
                  borderTop: "1px solid #e2e8f0",
                  fontSize: 11,
                  color: "#64748b",
                }}
              >
                <strong style={{ color: "#334155" }}>Notes : </strong>
                {creditNote.notes}
              </div>
            )}

            {/* Pied de page personnalisé */}
            {company?.footerText && (
              <div
                style={{
                  marginTop: 28,
                  paddingTop: 12,
                  borderTop: "1px solid #e2e8f0",
                  fontSize: 10,
                  color: "#64748b",
                  textAlign: "center",
                  lineHeight: 1.4,
                }}
              >
                {company.footerText}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
