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

const InvoicePDF = ({ invoice, totals, company }: FacturePDFProps) => {
  const factureRef = useRef<HTMLDivElement>(null);
  const logoSrc = company?.logoUrl?.split("?")[0];

  const handleDownloadPdf = async () => {
    const element = factureRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 3, useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "A4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
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

  return (
    <div className="mt-4 block">
      <div className="rounded-xl border-2 border-dashed border-base-300 p-5">
        <button onClick={handleDownloadPdf} className="btn btn-sm btn-info mb-4">
          Facture PDF
          <ArrowDownFromLine className="w-4" />
        </button>

        <div className="overflow-x-auto">
          <div className="min-w-[640px] bg-white p-8 text-black" ref={factureRef}>
            <div className="flex items-center justify-between text-sm">
              <div className="flex flex-col">
                <div className="flex items-center">
                  {logoSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoSrc}
                      alt="Logo"
                      className="h-12 w-12 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="rounded-full bg-info p-2 text-info-content">
                      <LayersPlus className="h-6 w-6" />
                    </div>
                  )}
                  <span className="ml-3 text-2xl font-bold italic">
                    Factu<span className="text-info">Pro</span>
                  </span>
                </div>
                <h1 className="text-5xl font-bold uppercase">Facture</h1>
              </div>
              <div className="text-right uppercase">
                <p className="badge badge-ghost">{invoice.number}</p>
                <p className="my-2">
                  <strong>Date </strong>
                  {formatDisplayDate(invoice.invoiceDate)}
                </p>
                <p>
                  <strong>Échéance </strong>
                  {formatDisplayDate(invoice.dueDate)}
                </p>
              </div>
            </div>

            <div className="my-6 flex justify-between">
              <div>
                <p className="badge badge-ghost mb-2">Émetteur</p>
                <p className="text-sm font-bold italic">{invoice.issuerName}</p>
                <p className="w-52 break-words text-sm text-gray-500">
                  {invoice.issuerAddress}
                </p>
                {company?.taxId && (
                  <p className="mt-1 text-xs text-gray-500">
                    IFU/NIF : {company.taxId}
                  </p>
                )}
                {company?.iban && (
                  <p className="text-xs text-gray-500">IBAN : {company.iban}</p>
                )}
              </div>
              <div className="text-right">
                <p className="badge badge-ghost mb-2">Client</p>
                <p className="text-sm font-bold italic">{invoice.clientName}</p>
                <p className="ml-auto w-52 break-words text-sm text-gray-500">
                  {invoice.clientAddress}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th />
                    <th>Description</th>
                    <th>Quantité</th>
                    <th>Prix unitaire</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lines.map((ligne, index) => (
                    <tr key={ligne.id}>
                      <td>{index + 1}</td>
                      <td>{ligne.description}</td>
                      <td>{ligne.quantity}</td>
                      <td>
                        {formatMoney(ligne.unitPrice, invoice.currency)}
                      </td>
                      <td>
                        {formatMoney(
                          ligne.quantity * ligne.unitPrice,
                          invoice.currency,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 space-y-2 text-md">
              <div className="flex justify-between">
                <div className="font-bold">Total Hors Taxes</div>
                <div>{formatMoney(totals.totalHT, invoice.currency)}</div>
              </div>

              {invoice.vatActive && (
                <div className="flex justify-between">
                  <div className="font-bold">TVA {invoice.vatRate} %</div>
                  <div>{formatMoney(totals.totalVAT, invoice.currency)}</div>
                </div>
              )}

              <div className="flex justify-between">
                <div className="font-bold">Total TTC</div>
                <div className="badge badge-info">
                  {formatMoney(totals.totalTTC, invoice.currency)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePDF;
