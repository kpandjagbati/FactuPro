"use client";

import { formatDisplayDate } from "@/lib/format";
import type { CompanyProfile, Invoice } from "@/type";
import confetti from "canvas-confetti";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { ArrowDownFromLine, CheckCircle2, LayersPlus, Truck } from "lucide-react";
import { useRef, useState } from "react";

interface Props {
  invoice: Invoice;
  company?: CompanyProfile | null;
}

export default function DeliveryNotePDF({ invoice, company }: Props) {
  const blRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const brandColor = company?.primaryColor || "#0284c7";

  const logoSrc = company?.logoUrl?.startsWith("data:")
    ? company.logoUrl
    : company?.logoUrl?.split("?")[0];

  const handleDownloadPdf = async () => {
    const element = blRef.current;
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

      pdf.save(`bon-de-livraison-${invoice.deliveryNumber || "BL"}.pdf`);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        zIndex: 9999,
      });
    } catch (error) {
      console.error("Erreur génération PDF Bon de Livraison :", error);
    } finally {
      if (wrapper && wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={handleDownloadPdf}
          disabled={isGenerating}
          className="btn btn-info btn-sm sm:btn-md gap-2"
        >
          {isGenerating ? "Génération en cours..." : "Télécharger le Bon de Livraison (PDF)"}
          <ArrowDownFromLine className="h-4 w-4" />
        </button>
      </div>

      <div
        className="w-full overflow-hidden bg-base-300/30 p-2 sm:p-4"
        style={{ borderRadius: 0 }}
      >
        <div className="pdf-preview-scale flex justify-center">
          <div
            ref={blRef}
            style={{
              width: "794px",
              minHeight: "1123px",
              backgroundColor: "#ffffff",
              padding: "40px",
              color: "#0f172a",
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
              boxSizing: "border-box",
              borderRadius: 0,
            }}
          >
            {/* En-tête */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "2px solid #0f172a",
                paddingBottom: 24,
                marginBottom: 28,
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "-0.5px",
                    color: "#0f172a",
                    margin: "0 0 6px 0",
                    lineHeight: 1.2,
                  }}
                >
                  Bon de Livraison
                </h1>
                <p
                  style={{
                    fontSize: 14,
                    color: brandColor,
                    fontWeight: 700,
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  N° {invoice.deliveryNumber || "BL-NON-ASSIGNE"}
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    margin: "4px 0 0 0",
                    lineHeight: 1.3,
                  }}
                >
                  Réf. Facture associée : <strong>{invoice.number}</strong>
                </p>
              </div>

              {logoSrc ? (
                <div style={{ maxWidth: 160, maxHeight: 75 }}>
                  <img
                    src={logoSrc}
                    alt="Logo entreprise"
                    style={{
                      maxWidth: "160px",
                      maxHeight: "75px",
                      objectFit: "contain",
                      display: "block",
                      borderRadius: 0,
                    }}
                  />
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center" }}>
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
                  <span
                    style={{
                      marginLeft: 12,
                      fontSize: 24,
                      fontWeight: 800,
                      fontStyle: "italic",
                      color: "#0f172a",
                      lineHeight: 1,
                    }}
                  >
                    Factu<span style={{ color: brandColor }}>Pro</span>
                  </span>
                </div>
              )}
            </div>

            {/* Dates et Statut */}
            <div
              style={{
                display: "flex",
                gap: 24,
                marginBottom: 24,
                padding: "10px 14px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                fontSize: 12,
              }}
            >
              <div>
                <span style={{ color: "#64748b", display: "block" }}>Date de livraison :</span>
                <strong style={{ color: "#0f172a" }}>
                  {invoice.deliveryDate
                    ? formatDisplayDate(invoice.deliveryDate)
                    : formatDisplayDate(new Date())}
                </strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block" }}>Date facture :</span>
                <strong style={{ color: "#0f172a" }}>
                  {invoice.invoiceDate
                    ? formatDisplayDate(invoice.invoiceDate)
                    : formatDisplayDate(invoice.createdAt)}
                </strong>
              </div>
            </div>

            {/* Émetteur & Destinataire */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 32,
                gap: 20,
              }}
            >
              <div style={{ flex: 1, maxWidth: 320 }}>
                <span
                  style={{
                    display: "inline-block",
                    backgroundColor: "#f1f5f9",
                    color: "#334155",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 0,
                    marginBottom: 8,
                    textTransform: "uppercase",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  Expéditeur / Fournisseur
                </span>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#0f172a",
                    margin: "0 0 4px 0",
                  }}
                >
                  {invoice.issuerName || "—"}
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.4,
                    margin: 0,
                  }}
                >
                  {invoice.issuerAddress || "—"}
                </p>
              </div>

              <div style={{ flex: 1, maxWidth: 320, textAlign: "right" }}>
                <span
                  style={{
                    display: "inline-block",
                    backgroundColor: "#f1f5f9",
                    color: "#334155",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 0,
                    marginBottom: 8,
                    textTransform: "uppercase",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  Destinataire / Client
                </span>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#0f172a",
                    margin: "0 0 4px 0",
                  }}
                >
                  {invoice.clientName || "—"}
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.4,
                    margin: 0,
                  }}
                >
                  {invoice.clientAddress || "—"}
                </p>
              </div>
            </div>

            {/* Tableau des marchandises & quantités livrées */}
            <div style={{ marginBottom: 32 }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#0f172a",
                      color: "#ffffff",
                      fontSize: 11,
                      textTransform: "uppercase",
                    }}
                  >
                    <th style={{ padding: "10px 12px", textAlign: "left", width: "40px" }}>#</th>
                    <th style={{ padding: "10px 12px", textAlign: "left" }}>Désignation des Articles / Marchandises</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", width: "120px" }}>Qté Livrée</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", width: "120px" }}>Conformité</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lines.map((l, i) => (
                    <tr
                      key={l.id}
                      style={{
                        backgroundColor: i % 2 === 1 ? "#f8fafc" : "#ffffff",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      <td style={{ padding: "10px 12px", color: "#94a3b8" }}>{i + 1}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 500, color: "#0f172a" }}>
                        {l.description}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          textAlign: "right",
                          fontWeight: 700,
                          color: "#0284c7",
                          fontSize: 14,
                        }}
                      >
                        {l.quantity}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: "#16a34a" }}>
                        [ Conforme ]
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Zone de Visa et Émargement de réception */}
            <div
              style={{
                marginTop: 40,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 24,
              }}
            >
              <div
                style={{
                  border: "1px solid #cbd5e1",
                  padding: "16px",
                  minHeight: "120px",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#475569", marginBottom: 8 }}>
                  Visa du Livreur / Expéditeur
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 45 }}>
                  Signature & Cachet
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #0f172a",
                  padding: "16px",
                  minHeight: "120px",
                  backgroundColor: "#f8fafc",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#0f172a", marginBottom: 8 }}>
                  Réceptionnaire (Client)
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                  Date : ____ / ____ / ________
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 28 }}>
                  Nom, Signature & Cachet de réception
                </div>
              </div>
            </div>

            {/* Pied de page */}
            <div
              style={{
                marginTop: 40,
                paddingTop: 12,
                borderTop: "1px solid #e2e8f0",
                fontSize: 10,
                color: "#64748b",
                textAlign: "center",
              }}
            >
              {company?.footerText
                ? company.footerText
                : "Document valant décharge de livraison de marchandises conforme."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
