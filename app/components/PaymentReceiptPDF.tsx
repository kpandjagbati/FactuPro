"use client";

import { formatDisplayDate, formatMoney } from "@/lib/format";
import { generateQrCodeDataUrl } from "@/lib/qrcode";
import type { CompanyProfile, Invoice, Payment } from "@/type";
import confetti from "canvas-confetti";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { ArrowDownFromLine, CheckCircle2, LayersPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
  payment: Payment;
  invoice: Invoice;
  company?: CompanyProfile | null;
  totalTTC: number;
  totalPaidUntilNow: number;
  remainingDue: number;
}

export default function PaymentReceiptPDF({
  payment,
  invoice,
  company,
  totalTTC,
  totalPaidUntilNow,
  remainingDue,
}: Props) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  const brandColor = company?.primaryColor || "#0284c7";

  const logoSrc = company?.logoUrl?.startsWith("data:")
    ? company.logoUrl
    : company?.logoUrl?.split("?")[0];

  useEffect(() => {
    const generateQR = async () => {
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://factupro.tg";
      const targetUrl = invoice.publicToken
        ? `${origin}/view/invoice/${invoice.publicToken}`
        : `${origin}/invoice/${invoice.id}`;
      const url = await generateQrCodeDataUrl(targetUrl, { width: 140, margin: 1 });
      setQrCodeUrl(url);
    };
    void generateQR();
  }, [invoice.id, invoice.publicToken]);

  const handleDownloadPdf = async () => {
    const element = receiptRef.current;
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

      pdf.save(`recu-${payment.receiptNumber || "paiement"}.pdf`);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        zIndex: 9999,
      });
    } catch (error) {
      console.error("Erreur génération PDF Reçu :", error);
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
          {isGenerating ? "Génération en cours..." : "Télécharger le Reçu (PDF)"}
          <ArrowDownFromLine className="h-4 w-4" />
        </button>
      </div>

      <div
        className="w-full overflow-hidden bg-base-300/30 p-2 sm:p-4"
        style={{ borderRadius: 0 }}
      >
        <div className="pdf-preview-scale flex justify-center">
          <div
            ref={receiptRef}
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
                  Reçu de Paiement
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
                  N° {payment.receiptNumber || "REC-EN-COURS"}
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    margin: "4px 0 0 0",
                    lineHeight: 1.3,
                  }}
                >
                  Date d&apos;encaissement : <strong>{formatDisplayDate(payment.paymentDate)}</strong>
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

            {/* Tampon de confirmation ACQUITTÉ */}
            <div
              style={{
                marginBottom: 24,
                padding: "12px 16px",
                backgroundColor: "#f0fdf4",
                border: "1px solid #86efac",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    backgroundColor: "#16a34a",
                    color: "#ffffff",
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "4px 10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Règlement validé
                </span>
                <span style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>
                  Ce document certifie la bonne réception des fonds par l&apos;émetteur.
                </span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#16a34a" }}>
                {formatMoney(payment.amount, invoice.currency)}
              </div>
            </div>

            {/* Parties : Émetteur & Payeur */}
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
                  Bénéficiaire (Émetteur)
                </span>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#0f172a",
                    margin: "0 0 4px 0",
                  }}
                >
                  {company?.name || invoice.issuerName || "—"}
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
                  {company?.address || invoice.issuerAddress || "—"}
                </p>
                {company?.taxId && (
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0 0" }}>
                    NIF / RCCM : {company.taxId}
                  </p>
                )}
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
                  Payeur (Client)
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
                {invoice.clientEmail && (
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0 0" }}>
                    {invoice.clientEmail}
                  </p>
                )}
              </div>
            </div>

            {/* Détails du règlement */}
            <div style={{ marginBottom: 32 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#475569",
                  marginBottom: 10,
                }}
              >
                Détail de la transaction
              </div>

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
                    <th style={{ padding: "10px 12px", textAlign: "left" }}>Désignation / Motif</th>
                    <th style={{ padding: "10px 12px", textAlign: "left" }}>Mode de paiement</th>
                    <th style={{ padding: "10px 12px", textAlign: "left" }}>Réf. Transaction</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Montant Encaissé</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "12px", fontWeight: 600, color: "#0f172a" }}>
                      Règlement sur Facture {invoice.number}
                      <div style={{ fontSize: 11, fontWeight: "normal", color: "#64748b", marginTop: 2 }}>
                        {invoice.name}
                      </div>
                    </td>
                    <td style={{ padding: "12px", color: "#334155", fontWeight: 600 }}>
                      {payment.paymentMethod}
                    </td>
                    <td style={{ padding: "12px", color: "#64748b", fontFamily: "monospace" }}>
                      {payment.reference || "—"}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontWeight: 800,
                        color: "#16a34a",
                        fontSize: 15,
                      }}
                    >
                      {formatMoney(payment.amount, invoice.currency)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Récapitulatif du compte client sur cette facture */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 32,
              }}
            >
              <div style={{ width: "320px", fontSize: 13, lineHeight: 1.6 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#64748b",
                    paddingBottom: 4,
                  }}
                >
                  <span>Montant total facture TTC :</span>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>
                    {formatMoney(totalTTC, invoice.currency)}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#16a34a",
                    fontWeight: 600,
                    paddingBottom: 4,
                  }}
                >
                  <span>Total payé à date :</span>
                  <span>{formatMoney(totalPaidUntilNow, invoice.currency)}</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: 8,
                    borderTop: "2px solid #0f172a",
                    fontSize: 14,
                    fontWeight: 800,
                    color: remainingDue === 0 ? "#16a34a" : "#dc2626",
                  }}
                >
                  <span>Solde restant dû :</span>
                  <span>{formatMoney(remainingDue, invoice.currency)}</span>
                </div>
              </div>
            </div>

            {/* Notes éventuelles */}
            {payment.notes && (
              <div
                style={{
                  marginBottom: 24,
                  padding: "10px 14px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  fontSize: 11,
                  color: "#64748b",
                }}
              >
                <strong style={{ color: "#334155" }}>Observations : </strong>
                {payment.notes}
              </div>
            )}

            {/* Bloc QR Code de vérification */}
            {qrCodeUrl && (
              <div
                style={{
                  marginBottom: 20,
                  padding: "10px 14px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div style={{ flex: 1, fontSize: 11, color: "#334155", lineHeight: 1.4 }}>
                  <div style={{ fontWeight: 800, fontSize: 12, color: "#0f172a", marginBottom: 2 }}>
                    Vérification & Authenticité en ligne
                  </div>
                  <div style={{ color: "#64748b" }}>
                    Scannez ce QR Code pour vérifier l&apos;authenticité de cette quittance et consulter l&apos;état actualisé de la facture.
                  </div>
                </div>

                <div
                  style={{
                    width: 50,
                    height: 50,
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    padding: 2,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={qrCodeUrl}
                    alt="QR Code Reçu"
                    style={{ width: "100%", height: "100%", display: "block" }}
                  />
                </div>
              </div>
            )}

            {/* Zones d'émargement et de signature (Client et Émetteur) */}
            <div
              style={{
                marginTop: 20,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
              }}
            >
              {/* Emplacement Signature Client */}
              <div
                style={{
                  border: "1px solid #cbd5e1",
                  padding: "12px 14px",
                  minHeight: "125px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  backgroundColor: "#ffffff",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      color: "#0f172a",
                      letterSpacing: "0.3px",
                    }}
                  >
                    Pour le Client / Payeur
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                    {invoice.clientName || "Client"}
                  </div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 6, fontStyle: "italic" }}>
                    Mention manuscrite : « Reçu conforme »
                  </div>
                </div>

                <div
                  style={{
                    borderTop: "1px dashed #cbd5e1",
                    paddingTop: 6,
                    fontSize: 10,
                    color: "#94a3b8",
                    textAlign: "center",
                  }}
                >
                  Date et Signature du Client
                </div>
              </div>

              {/* Emplacement Signature et Cachet Émetteur */}
              <div
                style={{
                  border: "1px solid #cbd5e1",
                  padding: "12px 14px",
                  minHeight: "125px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  backgroundColor: "#ffffff",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      color: "#0f172a",
                      letterSpacing: "0.3px",
                    }}
                  >
                    Pour l&apos;Émetteur / Entreprise
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                    {company?.name || invoice.issuerName || "L'Émetteur"}
                  </div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 6, fontStyle: "italic" }}>
                    Cachet de l&apos;entreprise & Signature autorisée
                  </div>
                </div>

                <div
                  style={{
                    borderTop: "1px dashed #cbd5e1",
                    paddingTop: 6,
                    fontSize: 10,
                    color: "#94a3b8",
                    textAlign: "center",
                  }}
                >
                  Date, Cachet et Signature
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                marginTop: 35,
                paddingTop: 10,
                borderTop: "1px solid #e2e8f0",
                fontSize: 10,
                color: "#94a3b8",
                textAlign: "center",
              }}
            >
              {company?.footerText
                ? company.footerText
                : "Quittance délivrée à titre de preuve d'encaissement. FactuPro."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
